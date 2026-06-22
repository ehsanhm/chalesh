(function () {
  "use strict";

  function countRoles(arr) {
    const c = {};
    for (let i = 0; i < arr.length; i++) {
      const x = arr[i];
      c[x] = (c[x] || 0) + 1;
    }
    return c;
  }

  /** Same multiset as countRoles, but keys sorted — assertDeepEqual is order-sensitive for object keys in some runners. */
  function countRolesSorted(arr) {
    const c = countRoles(arr);
    const out = {};
    Object.keys(c)
      .sort()
      .forEach(function (k) {
        out[k] = c[k];
      });
    return out;
  }

  function emptyLegacy(names) {
    const mock = {};
    for (let i = 0; i < names.length; i++) mock[names[i]] = { recentGames: [] };
    return mock;
  }

  function rollBelow(prob) {
    if (prob <= 0) return 0;
    return Math.max(0, Math.min(0.999999, prob - 0.000001));
  }

  function rollAbove(prob) {
    if (prob >= 1) return 0.999999;
    return Math.max(0, Math.min(0.999999, prob + 0.000001));
  }

  function sideOf(roleId) {
    return roles[roleId] && roles[roleId].teamFa === "شهر" ? "town" : "dark";
  }

  function teamOf(roleId) {
    const team = roles[roleId] && roles[roleId].teamFa;
    if (team === "شهر") return "town";
    if (team === "مافیا") return "mafia";
    if (team === "مستقل") return "independent";
    return team || "unknown";
  }

  function assertDifferentTeams(assert, out, teamAIdxs, teamBIdxs, label) {
    for (let a = 0; a < teamAIdxs.length; a++) {
      for (let b = 0; b < teamBIdxs.length; b++) {
        assert(
          teamOf(out[teamAIdxs[a]]) !== teamOf(out[teamBIdxs[b]]),
          label + ": " + teamAIdxs[a] + " and " + teamBIdxs[b] + " should be on different role teams",
        );
      }
    }
  }

  const TROLL_TEST_PLAYER_COUNTS = [12, 15];

  function fillNames(baseNames, nPlayers) {
    const names = baseNames.slice();
    for (let i = names.length; i < nPlayers; i++) {
      names.push("Player " + (i + 1));
    }
    return names;
  }

  function buildPool(nPlayers, darkCount) {
    const pool = [];
    for (let i = 0; i < darkCount; i++) pool.push("mafia");
    for (let i = darkCount; i < nPlayers; i++) pool.push("citizen");
    return pool;
  }

  function assignHistory(legacy, names, idxs, roleId) {
    for (let i = 0; i < idxs.length; i++) {
      const name = names[idxs[i]];
      legacy[name].recentGames = Array(40).fill({ roleId: roleId });
    }
  }

  window.MAFIA_ROLE_ASSIGNER_TESTS = {
    name: "mafia-role-assigner",
    tests: [
      {
        name: "buildAssignment preserves multiset (3 mafia + 7 citizen)",
        fn: function ({ assert, assertDeepEqual }) {
          const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
          const legacy = emptyLegacy(names);
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen"];
          const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
          assert(out && out.length === 10, "expected 10 assignments");
          assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset must match pool");
        },
      },
      {
        name: "buildAssignment: independent counts as non-town slot",
        fn: function ({ assert, assertDeepEqual }) {
          const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
          const legacy = emptyLegacy(names);
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const pool = ["zodiac", "mafia", "mafia", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen"];
          const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
          assert(out && out.length === 10, "length");
          assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset");
          let z = 0;
          let m = 0;
          for (let i = 0; i < out.length; i++) {
            if (out[i] === "zodiac") z++;
            if (out[i] === "mafia") m++;
          }
          assert(z === 1 && m === 2, "zodiac + 2 mafia in assignment");
        },
      },
      {
        name: "buildAssignment returns null when playerNames too short",
        fn: function ({ assert }) {
          MafiaFairAssign.init({
            getLegacyRecord: function () {
              return { recentGames: [] };
            },
          });
          const out = MafiaFairAssign.buildAssignment(["mafia", "citizen"], ["only"], { roles: roles });
          assert(out === null, "expected null");
        },
      },
      {
        name: "badSideDeficit: same citizen-only rate for long vs short history (no veteran inflation)",
        fn: function ({ assert }) {
          const legacy = {
            vet: { recentGames: Array(20).fill({ roleId: "citizen" }) },
            newp: { recentGames: Array(3).fill({ roleId: "citizen" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          const n = 11;
          const bad = 3;
          const dVet = MafiaFairAssign._badSideDeficit("vet", roles, n, bad);
          const dNew = MafiaFairAssign._badSideDeficit("newp", roles, n, bad);
          assert(Math.abs(dVet - dNew) < 1e-9, "0% mafia rate over 20 games should equal 0% over 3 games");
        },
      },
      {
        name: "deficit balancing: under-bad history increases bad-side weight vs over-bad (weighted mode)",
        fn: function ({ assert }) {
          const legacy = {
            A: { recentGames: Array(24).fill({ roleId: "citizen" }) },
            B: { recentGames: Array(24).fill({ roleId: "godfather" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          MafiaFairAssign.configure({ groupPickMode: "weighted", balanceMode: true, balanceBoost: 0.55, balancePenalty: 0.65 });
          const wA = MafiaFairAssign._calcNonTownGroupWeight("A", roles, 10, 3);
          const wB = MafiaFairAssign._calcNonTownGroupWeight("B", roles, 10, 3);
          assert(wA > wB, "player with fewer recent bad games should have higher weight for bad side");
          MafiaFairAssign.configure({ groupPickMode: "deficit" });
        },
      },
      {
        name: "deficit mode: player over bad-share is not assigned non-town when others are owed",
        fn: function ({ assert }) {
          const names = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J"];
          const legacy = emptyLegacy(names);
          legacy.A.recentGames = Array(20).fill({ roleId: "citizen" });
          legacy.B.recentGames = Array(20).fill({ roleId: "godfather" });
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          MafiaFairAssign.configure({ groupPickMode: "deficit" });
          const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen", "citizen"];
          const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
          assert(out && out.length === 10, "assignment");
          const idxB = names.indexOf("B");
          const townFa = roles[out[idxB]] && roles[out[idxB]].teamFa;
          assert(townFa === "شهر", "chronically over-bad player should get city when others are owed bad slots");
        },
      },
      {
        name: "role coverage: under-seen roleId gets higher weight than over-seen",
        fn: function ({ assert }) {
          const legacy = {
            A: { recentGames: Array(20).fill({ roleId: "detective" }) },
            B: { recentGames: Array(20).fill({ roleId: "citizen" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          MafiaFairAssign.configure({
            roleCoverageMode: true,
            roleCoverageBoost: 0.55,
            roleCoveragePenalty: 0.4,
          });
          const wA = MafiaFairAssign._calcRoleSlotWeight("A", "detective", 10, 1);
          const wB = MafiaFairAssign._calcRoleSlotWeight("B", "detective", 10, 1);
          assert(wB > wA, "player who rarely had detective should have higher weight for detective slot");
        },
      },
      {
        name: "troll config: requested dark, white, and clash aliases",
        fn: function ({ assert }) {
          const cfg = MafiaFairAssign._trollConfig;
          const darkCases = [
            "Shohreh",
            "Shoreh khanoom",
            "Shouhreh-7",
            "Shuhre jan",
            "آقا شهره",
            "شُهره جان",
            "Khodayar",
            "آقا خدایار",
            "Jahanbakhsh",
            "آقا جهانبخش",
            "Ghasem",
            "Qasem jan",
            "قاسم خان",
            "Masoud",
            "Masood khan",
            "مسعود خان",
            "Payam",
            "Payam joon",
            "پیام جان",
            "Mehran",
            "مهران خان",
          ];
          const whiteCases = [
            "Mahtab",
            "مهتاب عزیز",
            "Naser",
            "ناصر جان",
            "ناصرخان",
            "Anahid",
            "Anahita",
            "آناهید",
            "Golsa",
            "گلسا جون",
          ];
          const clashOnlyCases = [
            "آقا مهدی",
            "آقامهدی",
            "مهدی3",
            "آرتین جان",
            "آرتینجان",
            "Mohammad",
            "Mohamed Reza",
            "Muhammad-99",
            "Mamad joon",
            "آقا محمد",
            "محمّد جان",
            "محمدرضا",
            "Gisoo",
            "Gisu joon",
            "گیسو جان",
          ];
          const removedDarkCases = [
            "Behnam",
          ];
          for (let i = 0; i < darkCases.length; i++) {
            assert(cfg.isTarget(darkCases[i]), "expected dark-side match: " + darkCases[i]);
            assert(cfg.isBlacklisted(darkCases[i]), "dark-side name should be on the single dark list: " + darkCases[i]);
            assert(!cfg.isWhitelisted(darkCases[i]), "dark-side alias should not also be white-side: " + darkCases[i]);
          }
          for (let i = 0; i < whiteCases.length; i++) {
            assert(cfg.isWhitelisted(whiteCases[i]), "expected white-side match: " + whiteCases[i]);
            assert(!cfg.isTarget(whiteCases[i]), "white-side alias should not also be dark-side: " + whiteCases[i]);
          }
          for (let i = 0; i < clashOnlyCases.length; i++) {
            assert(!cfg.isTarget(clashOnlyCases[i]), "clash-only alias should not be dark-side: " + clashOnlyCases[i]);
            assert(!cfg.isWhitelisted(clashOnlyCases[i]), "clash-only alias should not be white-side: " + clashOnlyCases[i]);
          }
          for (let i = 0; i < removedDarkCases.length; i++) {
            assert(!cfg.isTarget(removedDarkCases[i]), "removed alias should not be dark-side: " + removedDarkCases[i]);
          }
          assert(!cfg.isTarget("Player 10"), "numbered generic player must not become a troll target");
        },
      },
      {
        name: "troll config: trigger detection survives Persian digits, prefixes, and suffixes",
        fn: function ({ assert }) {
          const cfg = MafiaFairAssign._trollConfig;
          assert(
            cfg.isTriggered(["۱ مسعود", "قاسم جان", "گلسا جون", "Player 10"]),
            "three decorated trigger aliases should activate troll detection",
          );
        },
      },
      {
        name: "troll mode: assignment mode does not lock on trigger-only names",
        fn: function ({ assert }) {
          const cfg = MafiaFairAssign._trollConfig;
          const names = ["hhhhhh", "artin", "mahtab", "tina", "mahsa", "mahdi", "Ehsan"];
          try {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
            assert(cfg.mode === "assignment", "default troll mode should be assignment");
            assert(cfg.isTriggered(names), "three trigger aliases should trigger");
            assert(!cfg.shouldLock(names), "assignment mode should not lock devices");
            assert(cfg.getLockTargets(names).length === 0, "assignment mode should not return lock targets");
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll config: trollSystemEnabled disables troll behavior",
        fn: function ({ assert }) {
          const names = ["Mahdi", "Masoud", "Golsa", "Naser", "Mehran", "Khodayar"];
          const legacy = {
            Mahdi: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Masoud: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Golsa: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Naser: { recentGames: Array(40).fill({ roleId: "mafia" }) },
            Mehran: { recentGames: Array(40).fill({ roleId: "mafia" }) },
            Khodayar: { recentGames: Array(40).fill({ roleId: "mafia" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          try {
            MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: false, trollSystemMode: "assignment" });
            const cfg = MafiaFairAssign._trollConfig;
            assert(!cfg.enabled, "troll system should report disabled");
            assert(!cfg.isTriggered(names), "disabled troll system should not report triggered");
            assert(!cfg.shouldLock(names), "disabled troll system should not lock browser");
            assert(cfg.getLockTargets(names).length === 0, "disabled troll system should not return lock targets");

            const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen"];
            const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
            assert(out && out.length === names.length, "assignment");
            for (let i of [3, 4, 5]) {
              assert(out[i] === "citizen", "disabled troll system should leave over-used targets in town slots: " + names[i]);
            }
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll mode: disabled turns off troll behavior",
        fn: function ({ assert }) {
          const names = ["Mahdi", "Masoud", "Golsa", "Naser", "Mehran", "Khodayar"];
          const legacy = {
            Mahdi: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Masoud: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Golsa: { recentGames: Array(40).fill({ roleId: "citizen" }) },
            Naser: { recentGames: Array(40).fill({ roleId: "mafia" }) },
            Mehran: { recentGames: Array(40).fill({ roleId: "mafia" }) },
            Khodayar: { recentGames: Array(40).fill({ roleId: "mafia" }) },
          };
          MafiaFairAssign.init({
            getLegacyRecord: function (name) {
              return legacy[name] || { recentGames: [] };
            },
          });
          try {
            MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "disabled" });
            const cfg = MafiaFairAssign._trollConfig;
            assert(cfg.mode === "disabled", "mode should report disabled");
            assert(!cfg.enabled, "disabled mode should report system disabled");
            assert(!cfg.isTriggered(names), "disabled mode should not report triggered");
            assert(!cfg.shouldLock(names), "disabled mode should not lock browser");
            assert(cfg.getLockTargets(names).length === 0, "disabled mode should not return lock targets");

            const pool = ["mafia", "mafia", "mafia", "citizen", "citizen", "citizen"];
            const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
            assert(out && out.length === names.length, "assignment");
            for (let i of [3, 4, 5]) {
              assert(out[i] === "citizen", "disabled mode should leave over-used targets in town slots: " + names[i]);
            }
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll assignment: requested dark names go dark while white names stay town",
        fn: function ({ assert, assertDeepEqual }) {
          const oldRandom = Math.random;
          const cfg = MafiaFairAssign._trollConfig;
          Math.random = function () {
            return Math.min(rollBelow(cfg.prob), rollBelow(cfg.whitelistProb));
          };
          try {
            for (let c = 0; c < TROLL_TEST_PLAYER_COUNTS.length; c++) {
              const nPlayers = TROLL_TEST_PLAYER_COUNTS[c];
              const names = fillNames(["Khodayar", "Jahanbakhsh", "Shohreh", "Payam", "Ghasem", "Mehran", "Anahid", "Setareh", "Golsa"], nPlayers);
              const legacy = emptyLegacy(names);
              assignHistory(legacy, names, [0, 1, 2, 3, 4, 5], "mafia");
              assignHistory(legacy, names, Array.from({ length: nPlayers - 6 }, (_, i) => i + 6), "citizen");
              MafiaFairAssign.init({
                getLegacyRecord: function (name) {
                  return legacy[name] || { recentGames: [] };
                },
              });
              MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "assignment" });
              assert(cfg.enabled, "troll assignment should be enabled for " + nPlayers + " players");
              assert(cfg.mode === "assignment", "troll mode should be assignment for " + nPlayers + " players");
              assert(cfg.isTriggered(names), "trigger names should activate assignment troll for " + nPlayers + " players");
              assert(!cfg.shouldLock(names), "assignment mode should not lock browser for " + nPlayers + " players");

              const pool = buildPool(nPlayers, 6);
              const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
              assert(out && out.length === nPlayers, "assignment for " + nPlayers + " players");
              assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset must stay intact after troll side rules for " + nPlayers + " players");

              if (cfg.prob > 0) {
                for (let i of [0, 1, 2, 3, 4, 5]) {
                  assert(sideOf(out[i]) === "dark", "dark-side name should be non-town when _TROLL_PROB hits for " + nPlayers + " players: " + names[i]);
                }
              }
              if (cfg.whitelistProb > 0) {
                for (let i of [6, 7, 8]) {
                  assert(sideOf(out[i]) === "town", "white-side name should stay town when _TROLL_WHITELIST_PROB hits for " + nPlayers + " players: " + names[i]);
                }
              }
            }
          } finally {
            Math.random = oldRandom;
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll assignment: configured dark probability controls dark names",
        fn: function ({ assert, assertDeepEqual }) {
          const cfg = MafiaFairAssign._trollConfig;
          const buildWithRoll = function (nPlayers, targetName, roll) {
            const names = fillNames([targetName], nPlayers);
            const legacy = emptyLegacy(names);
            legacy[targetName].recentGames = Array(40).fill({ roleId: "mafia" });
            assignHistory(legacy, names, Array.from({ length: nPlayers - 1 }, (_, i) => i + 1), "citizen");
            MafiaFairAssign.init({
              getLegacyRecord: function (name) {
                return legacy[name] || { recentGames: [] };
              },
            });
            const pool = buildPool(nPlayers, 1);
            const oldRandom = Math.random;
            Math.random = function () { return roll; };
            try {
              return {
                out: MafiaFairAssign.buildAssignment(pool, names, { roles: roles }),
                pool: pool,
              };
            } finally {
              Math.random = oldRandom;
            }
          };

          try {
            MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "assignment" });
            for (let c = 0; c < TROLL_TEST_PLAYER_COUNTS.length; c++) {
              const nPlayers = TROLL_TEST_PLAYER_COUNTS[c];
              const targetNames = ["Khodayar", "Payam", "Jahanbakhsh", "Mehran"];
              for (let t = 0; t < targetNames.length; t++) {
                const targetName = targetNames[t];
                if (cfg.prob > 0) {
                  const below = buildWithRoll(nPlayers, targetName, rollBelow(cfg.prob));
                  assert(below.out && below.out.length === nPlayers, "below-threshold assignment for " + targetName + " with " + nPlayers + " players");
                  assertDeepEqual(countRolesSorted(below.out), countRolesSorted(below.pool), "below-threshold multiset for " + targetName + " with " + nPlayers + " players");
                  assert(sideOf(below.out[0]) === "dark", "roll below configured _TROLL_PROB should push " + targetName + " dark for " + nPlayers + " players; prob=" + cfg.prob);
                }
                if (cfg.prob < 1) {
                  const above = buildWithRoll(nPlayers, targetName, rollAbove(cfg.prob));
                  assert(above.out && above.out.length === nPlayers, "above-threshold assignment for " + targetName + " with " + nPlayers + " players");
                  assertDeepEqual(countRolesSorted(above.out), countRolesSorted(above.pool), "above-threshold multiset for " + targetName + " with " + nPlayers + " players");
                  assert(sideOf(above.out[0]) === "town", "roll above configured _TROLL_PROB should leave " + targetName + " to fairness for " + nPlayers + " players; prob=" + cfg.prob);
                }
              }
            }
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll assignment: configured whitelist probability controls white names",
        fn: function ({ assert, assertDeepEqual }) {
          const cfg = MafiaFairAssign._trollConfig;
          const buildWithRoll = function (nPlayers, targetName, roll) {
            const names = fillNames([targetName], nPlayers);
            const legacy = emptyLegacy(names);
            legacy[targetName].recentGames = Array(40).fill({ roleId: "citizen" });
            assignHistory(legacy, names, Array.from({ length: nPlayers - 1 }, (_, i) => i + 1), "mafia");
            MafiaFairAssign.init({
              getLegacyRecord: function (name) {
                return legacy[name] || { recentGames: [] };
              },
            });
            const pool = buildPool(nPlayers, 1);
            const oldRandom = Math.random;
            Math.random = function () { return roll; };
            try {
              return {
                out: MafiaFairAssign.buildAssignment(pool, names, { roles: roles }),
                pool: pool,
              };
            } finally {
              Math.random = oldRandom;
            }
          };

          try {
            MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "assignment" });
            for (let c = 0; c < TROLL_TEST_PLAYER_COUNTS.length; c++) {
              const nPlayers = TROLL_TEST_PLAYER_COUNTS[c];
              const targetNames = ["Mahtab", "Naser", "Anahid", "Setareh", "Golsa"];
              for (let t = 0; t < targetNames.length; t++) {
                const targetName = targetNames[t];
                if (cfg.whitelistProb > 0) {
                  const below = buildWithRoll(nPlayers, targetName, rollBelow(cfg.whitelistProb));
                  assert(below.out && below.out.length === nPlayers, "below-threshold whitelist assignment for " + targetName + " with " + nPlayers + " players");
                  assertDeepEqual(countRolesSorted(below.out), countRolesSorted(below.pool), "below-threshold whitelist multiset for " + targetName + " with " + nPlayers + " players");
                  assert(sideOf(below.out[0]) === "town", "roll below configured _TROLL_WHITELIST_PROB should protect " + targetName + " for " + nPlayers + " players; prob=" + cfg.whitelistProb);
                }
                if (cfg.whitelistProb < 1) {
                  const above = buildWithRoll(nPlayers, targetName, rollAbove(cfg.whitelistProb));
                  assert(above.out && above.out.length === nPlayers, "above-threshold whitelist assignment for " + targetName + " with " + nPlayers + " players");
                  assertDeepEqual(countRolesSorted(above.out), countRolesSorted(above.pool), "above-threshold whitelist multiset for " + targetName + " with " + nPlayers + " players");
                  assert(sideOf(above.out[0]) === "dark", "roll above configured _TROLL_WHITELIST_PROB should leave " + targetName + " to fairness for " + nPlayers + " players; prob=" + cfg.whitelistProb);
                }
              }
            }
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll assignment: requested clash teams land on different role teams",
        fn: function ({ assert, assertDeepEqual }) {
          const oldRandom = Math.random;
          const cfg = MafiaFairAssign._trollConfig;
          Math.random = function () {
            return Math.min(rollBelow(cfg.prob), rollBelow(cfg.whitelistProb));
          };
          try {
            for (let c = 0; c < TROLL_TEST_PLAYER_COUNTS.length; c++) {
              const nPlayers = TROLL_TEST_PLAYER_COUNTS[c];
              const names = fillNames(["Mahtab", "Artin", "Khodayar", "Mohammad", "Masoud", "Mahdi"], nPlayers);
              const legacy = emptyLegacy(names);
              MafiaFairAssign.init({
                getLegacyRecord: function (name) {
                  return legacy[name] || { recentGames: [] };
                },
              });
              MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "assignment" });
              const pool = buildPool(nPlayers, 3);
              const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
              assert(out && out.length === nPlayers, "assignment for " + nPlayers + " players");
              assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset must stay intact after troll clash teams for " + nPlayers + " players");

              assertDifferentTeams(assert, out, [0, 1, 2], [3, 4, 5], "clash teams for " + nPlayers + " players");
            }
          } finally {
            Math.random = oldRandom;
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll assignment: clash teams force same-side players apart",
        fn: function ({ assert, assertDeepEqual }) {
          const oldRandom = Math.random;
          const cfg = MafiaFairAssign._trollConfig;
          Math.random = function () {
            return Math.max(rollAbove(cfg.prob), rollAbove(cfg.whitelistProb));
          };
          try {
            for (let c = 0; c < TROLL_TEST_PLAYER_COUNTS.length; c++) {
              const nPlayers = TROLL_TEST_PLAYER_COUNTS[c];
              const names = fillNames(["Mahtab", "Artin", "Khodayar", "Mohammad", "Masoud", "Mahdi"], nPlayers);
              const legacy = emptyLegacy(names);
              assignHistory(legacy, names, [0, 1, 2, 3, 4, 5], "mafia");
              assignHistory(legacy, names, Array.from({ length: nPlayers - 6 }, (_, i) => i + 6), "citizen");
              MafiaFairAssign.init({
                getLegacyRecord: function (name) {
                  return legacy[name] || { recentGames: [] };
                },
              });
              MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "assignment" });
              const pool = buildPool(nPlayers, 3);
              const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
              assert(out && out.length === nPlayers, "assignment for " + nPlayers + " players");
              assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset must stay intact after forced clash teams for " + nPlayers + " players");

              assertDifferentTeams(assert, out, [0, 1, 2], [3, 4, 5], "forced clash teams for " + nPlayers + " players");
            }
          } finally {
            Math.random = oldRandom;
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll assignment: clash teams treat independent as a separate role team",
        fn: function ({ assert, assertDeepEqual }) {
          const oldRandom = Math.random;
          const cfg = MafiaFairAssign._trollConfig;
          Math.random = function () {
            return Math.max(rollAbove(cfg.prob), rollAbove(cfg.whitelistProb));
          };
          try {
            const names = ["Mahtab", "Artin", "Khodayar", "Mohammad", "Masoud", "Mahdi"];
            const legacy = emptyLegacy(names);
            assignHistory(legacy, names, [0, 1, 2, 3, 4, 5], "citizen");
            MafiaFairAssign.init({
              getLegacyRecord: function (name) {
                return legacy[name] || { recentGames: [] };
              },
            });
            MafiaFairAssign.configure({ groupPickMode: "deficit", trollSystemEnabled: true, trollSystemMode: "assignment" });
            const pool = ["zodiac", "killer", "nero", "mafia", "mafia", "mafia"];
            const out = MafiaFairAssign.buildAssignment(pool, names, { roles: roles });
            assert(out && out.length === names.length, "assignment with independent and mafia sides");
            assertDeepEqual(countRolesSorted(out), countRolesSorted(pool), "multiset must stay intact after exact-team clash");

            assertDifferentTeams(assert, out, [0, 1, 2], [3, 4, 5], "independent-vs-mafia clash teams");
            assert(
              new Set(out.map(teamOf)).has("independent"),
              "test setup should include independent roles as a separate team",
            );
          } finally {
            Math.random = oldRandom;
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
      {
        name: "troll mode: device-lock mode can still lock on three trigger names",
        fn: function ({ assert }) {
          const names = ["hhhhhh", "artin", "mahtab", "tina", "mahsa", "mahdi", "Ehsan"];
          try {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "device-lock" });
            const cfg = MafiaFairAssign._trollConfig;
            assert(cfg.mode === "device-lock", "mode should switch to device-lock");
            assert(cfg.shouldLock(names), "device-lock mode should lock on three trigger names");
            assert(cfg.getTriggerMatches(names).length === 3, "trigger matches should include the three trigger names");
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "block" });
            assert(cfg.mode === "device-lock", "block mode alias should switch to device-lock");
            assert(cfg.shouldLock(names), "block mode should lock on three trigger names");
          } finally {
            MafiaFairAssign.configure({ trollSystemEnabled: true, trollSystemMode: "assignment" });
          }
        },
      },
    ],
  };
})();

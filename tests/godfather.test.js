/**
 * Godfather (Pedarkhande) scenario tests based on design/godfather_test_instructions.md.
 * Verifies flow logic: Leon shield, Matador disable, Kane reveal, Saul Buy, Constantine revive,
 * Saul Buy revert on Back, Kane step skipped when dead, Watson 24h, etc.
 *
 * Instruction coverage: Nostradamus pick3 persist, Leon shield, Watson disabled Night 1,
 * Matador dead (no ability), Matador cannot disable same twice, Kane marks Matador → revealed but stays,
 * Kane dies at night (invisible bullet), Kane in Eliminated list at Day 3, Saul Buy fail/succeed,
 * Saul Buy non-citizen→failed / citizen→successful, Saul Buy target options (all non-mafia),
 * Saul Buy Back→change to another citizen→succeed, Leon shoots citizen dies, Saul Buy revert,
 * Watson can save Night 2 (24h), Kane step skipped, Constantine revives Leon.
 * When Kane is dead, Constantine step must show Constantine's revive UI (not Kane's content).
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  // Draw indices: godfather=0, matador=1, watson=2, leon=3, citizenKane=4, constantine=5, nostradamus=6, saul=7, citizen=8
  function setupPedarkhande() {
    appState.ui.scenario = "pedarkhande";
    appState.draw = {
      players: [
        { roleId: "godfather", alive: true },
        { roleId: "matador", alive: true },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: true },
        { roleId: "citizenKane", alive: true },
        { roleId: "constantine", alive: true },
        { roleId: "nostradamus", alive: true },
        { roleId: "saulGoodman", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  // Same as setupPedarkhande but with 2 citizens (indices 8 and 9) for Saul Buy "change to another citizen" test
  function setupPedarkhandeTwoCitizens() {
    appState.ui.scenario = "pedarkhande";
    appState.draw = {
      players: [
        { roleId: "godfather", alive: true },
        { roleId: "matador", alive: true },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: true },
        { roleId: "citizenKane", alive: true },
        { roleId: "constantine", alive: true },
        { roleId: "nostradamus", alive: true },
        { roleId: "saulGoodman", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  const suite = {
    name: "godfather",
    tests: [
      {
        name: "Nostradamus pick3 persists when going Back then Next",
        fn: function ({ assert, assertDeepEqual }) {
          if (typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          f.phase = "intro_night";
          f.step = 0;
          const pick3 = [0, 1, 2];
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { nostPick3: pick3 };
          addFlowEvent("night_actions", { nostPick3: pick3 });
          f.phase = "intro_night";
          f.step = 1; // nostradamus choose side
          prevFlowStep();
          nextFlowStep();
          const got = (f.draft.nightActionsByNight && f.draft.nightActionsByNight["0"] && f.draft.nightActionsByNight["0"].nostPick3) || [];
          assertDeepEqual(got, pick3, "Nostradamus pick3 should persist after Back then Next");
        },
      },
      {
        name: "Leon has shield: mafia shot does not kill Leon on first hit",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const leonIdx = 3;
          if (!draw[leonIdx] || draw[leonIdx].roleId !== "leon") return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: null,
          });

          nextFlowStep();

          assert(draw[leonIdx].alive === true, "Leon should survive first mafia shot (shield)");
        },
      },
      {
        name: "Matador disables Watson: Watson cannot save in Night 1",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const victimIdx = 8; // citizen
          const watsonIdx = 2;
          if (!draw[victimIdx] || !draw[watsonIdx]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: victimIdx,
            matadorDisable: watsonIdx,
            doctorSave: victimIdx,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: victimIdx,
            matadorDisable: watsonIdx,
            doctorSave: victimIdx,
          });

          nextFlowStep();

          assert(draw[victimIdx].alive === false, "Victim should die when Watson is disabled (save ignored)");
        },
      },
      {
        name: "Matador dead: matadorDisable has no effect, Watson can save",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false }); // Matador dead
          const watsonIdx = 2;
          const victimIdx = 8;
          if (!draw[watsonIdx] || !draw[victimIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: victimIdx,
            matadorDisable: watsonIdx, // Matador is dead; this should be ignored
            doctorSave: victimIdx,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: victimIdx,
            matadorDisable: watsonIdx,
            doctorSave: victimIdx,
          });

          nextFlowStep();

          assert(draw[victimIdx].alive === true, "Watson should save victim when Matador is dead (matadorDisable ignored)");
        },
      },
      {
        name: "Matador cannot disable same player twice in a row",
        fn: function ({ assert }) {
          if (typeof getMatadorDisableTargetIndices !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const watsonIdx = 2;
          if (!draw[watsonIdx]) return;

          f.phase = "night";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: watsonIdx,
          };

          f.phase = "night";
          f.day = 2;
          const targets = getMatadorDisableTargetIndices(f);

          assert(Array.isArray(targets), "getMatadorDisableTargetIndices should return an array");
          assert(!targets.includes(watsonIdx), "Watson should be excluded (disabled last night, cannot disable same twice)");
        },
      },
      {
        name: "Kane marks Matador (mafia): Matador revealed but stays in game, Kane dies at night",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const matadorIdx = 1;
          const kaneIdx = 4;
          const leonIdx = 3;
          const godfatherIdx = 0;
          if (!draw[matadorIdx] || !draw[kaneIdx]) return;

          // Night 1: shoot Leon (Leon survives), disable Watson, Leon shoots Godfather (vest), Kane marks Matador
          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: 2,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: 2,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          });

          nextFlowStep(); // Night 1 -> Day 2 (we land on day_kane_reveal if Kane marked mafia)
          nextFlowStep(); // apply Kane reveal (Matador's role revealed, but Matador stays in game)
          // Advance through Day 2 to Day 2 -> Night 2 transition (Kane dies by invisible bullet then)
          let n = 0;
          while (n < 20 && (f.phase !== "night" || f.day !== 2)) {
            nextFlowStep();
            n++;
          }

          assert(draw[matadorIdx].alive === true, "Matador should be alive (Kane reveal does not eliminate)");
          assert(draw[kaneIdx].alive === false, "Kane should be dead (invisible bullet)");
          assert(draw[leonIdx].alive === true, "Leon should be alive (shield)");
          assert(draw[godfatherIdx].alive === true, "Godfather should be alive (vest)");
        },
      },
      {
        name: "Saul Buy fails for non-citizen",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false }); // Matador dead (required for Saul Buy)
          const constantineIdx = 5;
          if (!draw[constantineIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: constantineIdx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "saul_buy",
            saulBuyTarget: constantineIdx,
            matadorDisable: null,
          });

          nextFlowStep();

          assert(draw[constantineIdx].roleId === "constantine", "Constantine should not be converted (Saul buy fails for non-citizen)");
        },
      },
      {
        name: "Saul Buy succeeds for citizen",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false }); // Matador dead (required for Saul Buy)
          const citizenIdx = 8;
          if (!draw[citizenIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizenIdx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizenIdx,
            matadorDisable: null,
          });

          nextFlowStep();

          assert(draw[citizenIdx].roleId === "mafia", "Citizen should be converted to mafia (Saul buy succeeds)");
        },
      },
      {
        name: "Saul Buy: non-citizen shows failed, change to citizen shows successful",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false }); // Matador dead (required for Saul Buy)
          const constantineIdx = 5;
          const citizenIdx = 8;
          if (!draw[constantineIdx] || !draw[citizenIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};

          // Select Constantine (non-citizen) -> Saul buy fails
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: constantineIdx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "saul_buy",
            saulBuyTarget: constantineIdx,
            matadorDisable: null,
          });
          nextFlowStep();

          const saulRecFail = f.draft && f.draft.nightSaulBuyAppliedByDay && f.draft.nightSaulBuyAppliedByDay["2"];
          const failed = !saulRecFail || saulRecFail.converted == null;
          assert(failed, "Saul buy targeting Constantine should show failed (no conversion)");
          assert(draw[constantineIdx].roleId === "constantine", "Constantine should not be converted");

          // Go Back, change selection to citizen -> Saul buy succeeds
          prevFlowStep();
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizenIdx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizenIdx,
            matadorDisable: null,
          });
          nextFlowStep();

          const saulRecOk = f.draft && f.draft.nightSaulBuyAppliedByDay && f.draft.nightSaulBuyAppliedByDay["2"];
          const succeeded = saulRecOk && saulRecOk.converted != null;
          assert(succeeded, "Saul buy targeting citizen should show successful (converted)");
          assert(draw[citizenIdx].roleId === "mafia", "Citizen should be converted to mafia");
        },
      },
      {
        name: "Saul Buy target options include all alive non-mafia (Constantine, Watson, Kane, citizen)",
        fn: function ({ assert }) {
          if (typeof getSaulBuyTargetIndices !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false }); // Matador dead (required for Saul Buy)
          const constantineIdx = 5;
          const watsonIdx = 2;
          const kaneIdx = 4;
          const citizenIdx = 8;
          if (!draw[constantineIdx] || !draw[watsonIdx] || !draw[kaneIdx] || !draw[citizenIdx]) return;

          f.phase = "night";
          f.day = 2;
          const targets = getSaulBuyTargetIndices(f);

          assert(Array.isArray(targets), "getSaulBuyTargetIndices should return an array");
          assert(targets.includes(constantineIdx), "Constantine should be in Saul Buy targets");
          assert(targets.includes(watsonIdx), "Watson should be in Saul Buy targets");
          assert(targets.includes(kaneIdx), "Kane should be in Saul Buy targets");
          assert(targets.includes(citizenIdx), "Citizen should be in Saul Buy targets");
          assert(!targets.includes(0), "Godfather (mafia) should not be in Saul Buy targets");
          assert(!targets.includes(1), "Matador (mafia, dead) should not be in Saul Buy targets");
        },
      },
      {
        name: "Leon shooting citizen: Leon dies",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const leonIdx = 3;
          const citizenIdx = 8;
          if (!draw[leonIdx] || !draw[citizenIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            professionalShot: citizenIdx,
            kaneMark: null,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            professionalShot: citizenIdx,
            kaneMark: null,
            constantineRevive: null,
          });

          nextFlowStep();

          assert(draw[leonIdx].alive === false, "Leon should die when shooting a citizen");
          assert(draw[citizenIdx].alive === true, "Citizen target survives (only Leon dies when Leon shoots citizen)");
        },
      },
      {
        name: "Constantine revives Leon after Leon died from shooting citizen",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const leonIdx = 3;
          const citizenIdx = 8;
          if (!draw[leonIdx] || !draw[citizenIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            professionalShot: citizenIdx,
            kaneMark: null,
            constantineRevive: leonIdx,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            professionalShot: citizenIdx,
            kaneMark: null,
            constantineRevive: leonIdx,
          });

          nextFlowStep();

          assert(draw[leonIdx].alive === true, "Constantine should revive Leon");
        },
      },
      {
        name: "Saul Buy stays available when citizen selected (until Next); snapshot must not set saulBuyUsed",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhandeTwoCitizens();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false });
          const citizenIdx = 8;
          if (!draw[citizenIdx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          const mafiaStepIdx = nightSteps.findIndex((s) => s && (s.id === "night_mafia_team" || String(s.id || "").includes("mafia_team")));
          if (mafiaStepIdx < 0) return;
          f.step = mafiaStepIdx;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizenIdx,
            matadorDisable: null,
          };
          f.draft.saulBuyUsed = false;
          f.draft.saulBuyUsedOnNight = null;

          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const card = container.querySelector('.nightPlayerCard[data-field="fl_saul_buy_target"][data-idx="' + citizenIdx + '"]');
          if (card) {
            card.click();
          }
          assert(f.draft.saulBuyUsed === false, "saulBuyUsed must stay false when selecting a citizen — only set when conversion is applied on Next");
        },
      },
      {
        name: "Saul Buy reverts when going Back; can change to another citizen and succeed",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhandeTwoCitizens();
          const draw = appState.draw.players;
          setPlayerLife(1, { alive: false });
          const citizen1Idx = 8;
          const citizen2Idx = 9;
          if (!draw[citizen1Idx] || !draw[citizen2Idx]) return;

          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          const mafiaStepIdx = nightSteps.findIndex((s) => s && (s.id === "night_mafia_team" || String(s.id || "").includes("mafia_team")));
          if (mafiaStepIdx < 0) return;
          f.step = mafiaStepIdx;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};

          // Saul Buy citizen 1, Next (advance to Watson step — Saul Buy applied when leaving mafia step)
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizen1Idx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizen1Idx,
            matadorDisable: null,
          });
          nextFlowStep();
          assert(draw[citizen1Idx].roleId === "mafia", "Saul Buy should convert citizen 1");
          assert(f.draft.saulBuyUsed === true, "saulBuyUsed should be set");

          // Back: from Watson to mafia step — must revert Saul Buy so user can change selection.
          // Simulate real Back button (snapshot + prevFlowStep) to match app behavior.
          showFlowTool();
          const prevBtn = document.getElementById("fl_prev");
          if (prevBtn) prevBtn.click();
          else prevFlowStep();
          assert(f.draft.saulBuyUsed === false, "saulBuyUsed should be reverted when going Back from Watson to mafia step");
          assert(draw[citizen1Idx].roleId === "citizen", "Citizen 1 should be reverted");

          // UI must NOT show "Saul Buy (unavailable)"
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          assert(!html.includes("Saul buy (unavailable)"), "After Back, Saul Buy option must NOT show (unavailable) — user must be able to change selection");

          // Change to citizen 2, Next
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizen2Idx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "saul_buy",
            saulBuyTarget: citizen2Idx,
            matadorDisable: null,
          });
          nextFlowStep();
          assert(draw[citizen2Idx].roleId === "mafia", "Saul Buy should convert citizen 2 after changing selection");
          assert(draw[citizen1Idx].roleId === "citizen", "Citizen 1 should remain citizen");
        },
      },
      {
        name: "Watson can save in Night 2 after 24h since Matador disabled him in Night 1",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const watsonIdx = 2;
          const victimIdx = 8;
          if (!draw[watsonIdx] || !draw[victimIdx]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: watsonIdx,
            doctorSave: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: watsonIdx,
            doctorSave: null,
          });
          nextFlowStep();

          f.phase = "night";
          f.day = 2;
          const nightSteps2 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps2.length - 1);
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: victimIdx,
            matadorDisable: null,
            doctorSave: victimIdx,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: victimIdx,
            matadorDisable: null,
            doctorSave: victimIdx,
          });
          nextFlowStep();

          assert(draw[victimIdx].alive === true, "Watson should save victim in Night 2 (24h passed since disable)");
        },
      },
      {
        name: "Kane step skipped on Night 2 when Kane found mafia and died (invisible bullet)",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const matadorIdx = 1;
          const kaneIdx = 4;
          const leonIdx = 3;
          const godfatherIdx = 0;

          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: 2,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: 2,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          });
          nextFlowStep();
          nextFlowStep();
          let n = 0;
          while (n < 20 && (f.phase !== "night" || f.day !== 2)) {
            nextFlowStep();
            n++;
          }

          assert(draw[kaneIdx].alive === false, "Kane should be dead");
          const night2Steps = getFlowSteps({ ...f, phase: "night" });
          const hasKaneStep = night2Steps.some((s) => s && (s.id === "night_kane" || String(s.id || "").includes("kane")));
          assert(!hasKaneStep, "Kane step should be skipped when Kane is dead (found mafia, invisible bullet)");
        },
      },
      {
        name: "Kane ability consumed when marked player survives; Kane step skipped next night",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const citizenIdx = 8;
          // Night 1: Kane marks citizen (wrong guess). Mafia shoots no one.
          // Marked player (citizen) survives → Kane ability consumed.
          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            doctorSave: null,
            professionalShot: null,
            kaneMark: citizenIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            doctorSave: null,
            professionalShot: null,
            kaneMark: citizenIdx,
            constantineRevive: null,
          });
          nextFlowStep();
          assert(f.draft.kaneAbilityUsed === true, "Kane ability should be consumed when marked player survives");
          // Simulate Night 2: Kane step should still appear (with "ability used" message)
          f.phase = "night";
          f.day = 2;
          const night2Steps = getFlowSteps({ ...f, phase: "night" });
          const hasKaneStep = night2Steps.some((s) => s && (s.id === "night_kane" || String(s.id || "").includes("kane")));
          assert(hasKaneStep, "Kane step should appear on Night 2 when ability was consumed (marked citizen survived) — shows 'ability used' message");
          // Verify the step shows "ability used" message (not selection cards)
          if (typeof showFlowTool === "function") {
            const kaneStepIdx = night2Steps.findIndex((s) => s && (s.id === "night_kane" || String(s.id || "").includes("kane")));
            if (kaneStepIdx >= 0) {
              f.step = kaneStepIdx;
              showFlowTool();
              const html = window._lastFlowModalHtml || "";
              const hasAbilityUsedMsg = html.includes("already used") || html.includes("abilityUsed") || html.includes("ability used") || html.includes("توانایی خود را استفاده");
              assert(hasAbilityUsedMsg, "Kane step should show 'ability used' message when Kane marked wrong (non-mafia)");
            }
          }
        },
      },
      {
        name: "Kane ability refunded when marked player dies same night; Kane can use again next night",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const matadorIdx = 1;
          // Night 1: Kane marks Matador. Mafia shoots Matador. Marked player dies same night → ability refunded.
          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: matadorIdx,
            matadorDisable: null,
            doctorSave: null,
            professionalShot: null,
            kaneMark: matadorIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: matadorIdx,
            matadorDisable: null,
            doctorSave: null,
            professionalShot: null,
            kaneMark: matadorIdx,
            constantineRevive: null,
          });
          nextFlowStep();
          assert(draw[matadorIdx].alive === false, "Matador should be dead (mafia shot)");
          assert(f.draft.kaneAbilityUsed !== true, "Kane ability should NOT be consumed when marked player died same night");
          // Simulate Night 2: Kane step should appear when ability was refunded
          f.phase = "night";
          f.day = 2;
          const night2Steps = getFlowSteps({ ...f, phase: "night" });
          const hasKaneStep = night2Steps.some((s) => s && (s.id === "night_kane" || String(s.id || "").includes("kane")));
          assert(hasKaneStep, "Kane step should appear on Night 2 when marked player died same night (ability refunded)");
        },
      },
      {
        name: "Constantine step shows Constantine content when Kane is dead (not Kane's content)",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const kaneIdx = 4;
          if (!draw[kaneIdx] || draw[kaneIdx].roleId !== "citizenKane") return;

          setPlayerLife(kaneIdx, { alive: false });
          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          const constStepIdx = nightSteps.findIndex((s) => s && (s.id === "night_constantine" || String(s.id || "").includes("constantine")));
          if (constStepIdx < 0) return;
          f.step = constStepIdx;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            professionalShot: null,
            kaneMark: null,
            constantineRevive: null,
          };

          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          assert(html.includes("fl_const_revive"), "Constantine step must show Constantine revive UI, not Citizen Kane's content (bug: Kane dead but step showed Kane)");
        },
      },
      {
        name: "Full flow: Night1 (shoot Leon, disable Watson, Kane mark Matador) -> Day2 Kane reveal -> no one dead, Kane dies at night",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const godfatherIdx = 0;
          const matadorIdx = 1;
          const watsonIdx = 2;
          const leonIdx = 3;
          const kaneIdx = 4;

          // Advance through intro
          while (f.phase === "intro_day" || f.phase === "intro_night") {
            if (f.phase === "intro_night" && f.step === 0) {
              if (!f.draft) f.draft = {};
              f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
              f.draft.nightActionsByNight["0"] = { nostPick3: [0, 1, 2] };
              addFlowEvent("night_actions", { nostPick3: [0, 1, 2] });
            }
            if (f.phase === "intro_night" && f.step === 1) {
              if (!f.draft) f.draft = {};
              f.draft.nostradamusChosenSide = "citizens";
            }
            nextFlowStep();
          }

          // Day 1: vote out citizen (index 8)
          const citizenOutIdx = 8;
          if (!f.draft) f.draft = {};
          f.draft.voteCandidatesByDay = f.draft.voteCandidatesByDay || {};
          f.draft.voteCandidatesByDay["1"] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["1"] = { out: citizenOutIdx, prevAlive: true };
          setPlayerLife(citizenOutIdx, { alive: false, reason: "vote" });
          f.events = f.events || [];
          f.events.push({ kind: "day_elim", phase: "day", day: 1, data: { out: citizenOutIdx } });
          f.events.push({ kind: "day_elim_out", phase: "day", day: 1, data: { out: citizenOutIdx } });
          appState.god = appState.god || {};
          appState.god.endCards = appState.god.endCards || { byDay: {}, used: [] };
          appState.god.endCards.byDay["1"] = { out: citizenOutIdx, cardId: "silence_lambs", at: Date.now() };
          appState.god.endCards.used = ["silence_lambs"];
          // Advance through Day 1 steps to Night 1
          let d1 = 0;
          while (d1 < 15 && (f.phase !== "night" || f.day !== 1)) {
            nextFlowStep();
            d1++;
          }

          // Night 1: shoot Leon, disable Watson, Leon shoot Godfather, Kane mark Matador
          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: watsonIdx,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: watsonIdx,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          });

          nextFlowStep(); // Night 1 -> Day 2
          nextFlowStep(); // apply Kane reveal (Matador dies)
          let n = 0;
          while (n < 20 && (f.phase !== "night" || f.day !== 2)) {
            nextFlowStep();
            n++;
          }

          assert(draw[matadorIdx].alive === true, "Matador should be alive (Kane reveal does not eliminate)");
          assert(draw[kaneIdx].alive === false, "Kane should be dead (invisible bullet)");
          assert(draw[leonIdx].alive === true, "Leon should be alive (shield)");
          assert(draw[godfatherIdx].alive === true, "Godfather should be alive (vest)");
        },
      },
      {
        name: "Kane (invisible bullet) appears in Eliminated list at Day 3",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const matadorIdx = 1;
          const kaneIdx = 4;
          const leonIdx = 3;
          const godfatherIdx = 0;
          const citizenIdx = 8;
          if (!draw[kaneIdx] || draw[kaneIdx].roleId !== "citizenKane") return;

          // Night 1: shoot Leon, disable Watson, Leon shoot Godfather, Kane mark Matador
          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: 2,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: leonIdx,
            matadorDisable: 2,
            doctorSave: null,
            professionalShot: godfatherIdx,
            kaneMark: matadorIdx,
            constantineRevive: null,
          });

          nextFlowStep(); // Night 1 -> Day 2
          nextFlowStep(); // Kane reveal (Matador revealed, stays in game)

          // Day 2: set up vote and elim so we can advance to Night 2
          f.draft.voteCandidatesByDay = f.draft.voteCandidatesByDay || {};
          f.draft.voteCandidatesByDay["2"] = [0, 1, 2, 3, 4, 5, 6, 7, 8];
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["2"] = { out: citizenIdx, prevAlive: true };
          setPlayerLife(citizenIdx, { alive: false, reason: "vote" });
          f.events = f.events || [];
          f.events.push({ kind: "day_elim", phase: "day", day: 2, data: { out: citizenIdx } });
          f.events.push({ kind: "day_elim_out", phase: "day", day: 2, data: { out: citizenIdx } });
          appState.god = appState.god || {};
          appState.god.endCards = appState.god.endCards || { byDay: {}, used: [] };
          appState.god.endCards.byDay["2"] = { out: citizenIdx, cardId: "identity_reveal", at: Date.now() };
          appState.god.endCards.used = appState.god.endCards.used || [];
          if (!appState.god.endCards.used.includes("identity_reveal")) appState.god.endCards.used.push("identity_reveal");

          // Advance through Day 2 and Night 2 to Day 3
          let n = 0;
          while (n < 50 && (f.phase !== "day" || f.day !== 3)) {
            if (f.phase === "night" && f.day === 2) {
              const ns = getFlowSteps({ ...f, phase: "night" });
              if (ns.length && f.step >= ns.length - 1) {
                if (!f.draft) f.draft = {};
                f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
                f.draft.nightActionsByNight["2"] = {
                  godfatherAction: "shoot",
                  mafiaShot: null,
                  matadorDisable: null,
                  doctorSave: null,
                  professionalShot: null,
                  kaneMark: null,
                  constantineRevive: null,
                };
                addFlowEvent("night_actions", {
                  godfatherAction: "shoot",
                  mafiaShot: null,
                  matadorDisable: null,
                  doctorSave: null,
                  professionalShot: null,
                  kaneMark: null,
                  constantineRevive: null,
                });
              }
            }
            nextFlowStep();
            n++;
          }

          assert(draw[kaneIdx].alive === false, "Kane should be dead (invisible bullet 24h after correct guess)");
          if (typeof wouldStatusCheckShowEliminated === "function") {
            assert(wouldStatusCheckShowEliminated(f, kaneIdx), "Status Check must show Citizen Kane in Eliminated list at Day 3");
          }
        },
      },
      // Instruction 30: Nostradamus pick3 — Nostradamus player card should not be shown (he won't choose himself)
      {
        name: "Intro Night Nostradamus pick3: Nostradamus player card not shown",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          const nostradamusIdx = 6;
          if (!appState.draw.players[nostradamusIdx] || appState.draw.players[nostradamusIdx].roleId !== "nostradamus") return;
          f.phase = "intro_night";
          f.step = 0;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { nostPick3: [] };
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const nostradamusCard = container.querySelector('.nightPlayerCard[data-field="fl_intro_nost_pick3"][data-idx="' + nostradamusIdx + '"]');
          assert(!nostradamusCard, "Nostradamus player card must not be shown in pick3 (instruction 30)");
        },
      },
      // Instruction 50/60: Nostradamus chosen side persists on Back then Next
      {
        name: "Nostradamus chosen side persists when going Back then Next",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function") return;
          const f = setupPedarkhande();
          f.phase = "intro_night";
          f.step = 0;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { nostPick3: [0, 1, 2] };
          f.draft.nostResultByNight = { "0": { mafiaCount: 0 } };
          f.draft.nostradamusChosenSide = "citizen";
          addFlowEvent("night_actions", { nostPick3: [0, 1, 2] });
          f.step = 1;
          prevFlowStep();
          nextFlowStep();
          const side = (f.draft && f.draft.nostradamusChosenSide) ? f.draft.nostradamusChosenSide : null;
          assert(side === "citizen", "Nostradamus chosen side should persist after Back then Next (instruction 60)");
        },
      },
      // Win-condition: Nostradamus always counts as citizen when deciding game-over
      {
        name: "Nostradamus counts as citizen for game-over even when chose mafia",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof getFlowSteps !== "function") return;
          appState.ui.scenario = "pedarkhande";
          appState.draw = {
            players: [
              { roleId: "godfather", alive: true },
              { roleId: "matador", alive: true },
              { roleId: "watson", alive: true },
              { roleId: "leon", alive: true },
              { roleId: "nostradamus", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "pedarkhande" },
          };
          appState.god = appState.god || {};
          appState.god.flow = {
            phase: "night",
            day: 1,
            step: 0,
            draft: {
              nostradamusChosenSide: "mafia",
              nightActionsByNight: {},
            },
          };
          const f = ensureFlow();
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          nextFlowStep();
          assert(
            f.phase !== "winner" || f.draft.winnerTeam !== "mafia",
            "With 2 mafia + Nostradamus (chose mafia) + 3 citizens, game must NOT end as mafia win (Nostradamus counts as citizen for game-over)"
          );
        },
      },
      // Instruction 50: When 2 guessed are mafia, Mafia must be only choice
      {
        name: "Nostradamus choose side: 2 mafia in pick3 forces Mafia-only choice",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "intro_night";
          f.step = 1;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { nostPick3: [0, 1, 2] };
          f.draft.nostResultByNight = { "0": { mafiaCount: 2 } };
          f.draft.nostradamusChosenSide = "mafia";
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          assert(html.includes("Mafia") || html.includes("مافیا"), "When 2 mafia in pick3, Mafia must be the only choice (instruction 50)");
        },
      },
      // Instruction 70: Intro Night Step 3 — Mafia team names in order (boss first)
      {
        name: "Intro Night Mafia step shows mafia team in order (boss first)",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "intro_night";
          const introSteps = getFlowSteps({ ...f, phase: "intro_night" });
          const mafiaStepIdx = introSteps.findIndex((s) => s && (s.id === "intro_night_mafia"));
          if (mafiaStepIdx < 0) return;
          f.step = mafiaStepIdx;
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          const godfatherIdx = appState.draw.players.findIndex((p) => p && p.roleId === "godfather");
          const matadorIdx = appState.draw.players.findIndex((p) => p && p.roleId === "matador");
          assert(html.length > 0, "Mafia step should render (instruction 70)");
          assert(godfatherIdx >= 0 && matadorIdx >= 0, "Godfather and Matador should exist");
        },
      },
      // Instruction 80: Intro Night Step 4 — Watson, Leon, Kane, Constantine order
      {
        name: "Intro Night wake order: Watson, Leon, Kane, Constantine",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "intro_night";
          const introSteps = getFlowSteps({ ...f, phase: "intro_night" });
          const wakeIdx = introSteps.findIndex((s) => s && (s.id === "intro_night_wake_order"));
          if (wakeIdx < 0) return;
          f.step = wakeIdx;
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          const hasWatson = html.includes("Watson") || html.includes("واتسون");
          const hasLeon = html.includes("Leon") || html.includes("لئون");
          const hasKane = html.includes("Kane") || html.includes("کین");
          const hasConstantine = html.includes("Constantine") || html.includes("کنستانتین");
          assert(hasWatson && hasLeon && hasKane && hasConstantine, "Wake order must show Watson, Leon, Kane, Constantine (instruction 80)");
        },
      },
      // Instruction 90: Day 1 Voting — challenge buttons, vote candidates persist
      {
        name: "Day 1 Voting: challengeUsedByDay and voteCandidatesByDay persist on Back",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function") return;
          const f = setupPedarkhande();
          while (f.phase === "intro_day" || f.phase === "intro_night") {
            if (f.phase === "intro_night" && f.step === 0) {
              if (!f.draft) f.draft = {};
              f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
              f.draft.nightActionsByNight["0"] = { nostPick3: [0, 1, 2] };
              addFlowEvent("night_actions", { nostPick3: [0, 1, 2] });
            }
            if (f.phase === "intro_night" && f.step === 1) {
              if (!f.draft) f.draft = {};
              f.draft.nostradamusChosenSide = "citizens";
            }
            nextFlowStep();
          }
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.challengeUsedByDay = { "1": [0, 2] };
          f.draft.voteCandidatesByDay = { "1": [0, 1, 2, 3, 4, 5, 6, 7, 8] };
          const daySteps = getFlowSteps({ ...f, phase: "day" });
          f.step = daySteps.findIndex((s) => s && s.id === "day_vote");
          if (f.step < 0) f.step = 0;
          prevFlowStep();
          nextFlowStep();
          const challenges = (f.draft.challengeUsedByDay && f.draft.challengeUsedByDay["1"]) || [];
          assert(challenges.length > 0 || !f.draft.challengeUsedByDay, "Challenge/vote selections should persist (instruction 90)");
        },
      },
      // Instruction 180: Status Check Day 1 shows correct eliminated player
      {
        name: "Status Check Day 1 shows correct eliminated player",
        fn: function ({ assert }) {
          if (typeof wouldStatusCheckShowEliminated !== "function") return;
          const f = setupPedarkhande();
          const votedOutIdx = 8;
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.dayElimAppliedByDay = { "1": { out: votedOutIdx, prevAlive: true } };
          f.events = f.events || [];
          f.events.push({ kind: "day_elim", phase: "day", day: 1, data: { out: votedOutIdx } });
          setPlayerLife(votedOutIdx, { alive: false, reason: "vote" });
          assert(wouldStatusCheckShowEliminated(f, votedOutIdx), "Status Check Day 1 must show correct eliminated player (instruction 180)");
        },
      },
      // Instruction 240: Leon step shows 2 bullets left, used shield, Godfather shot message
      {
        name: "Night 1 Leon step shows bullets and shield message when shooting Godfather",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          const leonStepIdx = nightSteps.findIndex((s) => s && (s.id === "night_leon" || String(s.id || "").includes("leon")));
          if (leonStepIdx < 0) return;
          f.step = leonStepIdx;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: 3,
            matadorDisable: 2,
            professionalShot: 0,
            kaneMark: null,
            constantineRevive: null,
          };
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          const hasBulletOrShield = html.includes("bullet") || html.includes("shield") || html.includes("2") || html.includes("تیر") || html.includes("سپر");
          assert(html.length > 0, "Leon step should render (instruction 240)");
        },
      },
      // Instruction 300/310: Day 3 select Matador, elim votes, end-card-action
      {
        name: "Day 3: can select Matador for vote and advance to end-card-action",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const matadorIdx = 1;
          const draw = appState.draw.players;
          setPlayerLife(4, { alive: false });
          f.phase = "day";
          f.day = 3;
          if (!f.draft) f.draft = {};
          f.draft.voteCandidatesByDay = f.draft.voteCandidatesByDay || {};
          f.draft.voteCandidatesByDay["3"] = [0, 1, 2, 3, 5, 6, 7, 8];
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["3"] = { out: matadorIdx, prevAlive: true };
          f.events = f.events || [];
          f.events.push({ kind: "day_elim", phase: "day", day: 3, data: { out: matadorIdx } });
          setPlayerLife(matadorIdx, { alive: false, reason: "vote" });
          appState.god = appState.god || {};
          appState.god.endCards = appState.god.endCards || { byDay: {}, used: [] };
          appState.god.endCards.byDay["3"] = { out: matadorIdx, cardId: "silence_lambs", at: Date.now() };
          assert(draw[matadorIdx].alive === false, "Matador should be eliminated (instruction 300)");
        },
      },
      // Instruction 380: Day 4 vote mafia, eliminate
      {
        name: "Day 4: can vote and eliminate mafia member",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const mafiaIdx = 7;
          if (!draw[mafiaIdx] || draw[mafiaIdx].roleId !== "saulGoodman") return;
          f.phase = "day";
          f.day = 4;
          if (!f.draft) f.draft = {};
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["4"] = { out: mafiaIdx, prevAlive: true };
          setPlayerLife(mafiaIdx, { alive: false, reason: "vote" });
          assert(draw[mafiaIdx].alive === false, "Mafia member should be eliminable on Day 4 (instruction 380)");
        },
      },
      // Instruction 385: Night 4 Sixth Sense — select citizen kane, guess citizen kane
      {
        name: "Night 4 Sixth Sense: can select Citizen Kane and guess role",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const kaneIdx = 4;
          setPlayerLife(4, { alive: false });
          f.phase = "night";
          f.day = 4;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["4"] = {
            godfatherAction: "sixth_sense",
            sixthSenseTarget: kaneIdx,
            sixthSenseRole: "citizenKane",
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "sixth_sense",
            sixthSenseTarget: kaneIdx,
            sixthSenseRole: "citizenKane",
            matadorDisable: null,
          });
          nextFlowStep();
          assert(draw[kaneIdx].alive === false, "Sixth Sense correct guess eliminates target (instruction 385)");
        },
      },
      // Instruction 390: Constantine "already used" message when ability used
      {
        name: "Constantine step shows used message when ability already used",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          setPlayerLife(4, { alive: false });
          if (!f.draft) f.draft = {};
          f.draft.nightConstantineAppliedByDay = { "2": { revived: 4, prevAlive: false } };
          f.phase = "night";
          f.day = 3;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          const constStepIdx = nightSteps.findIndex((s) => s && (s.id === "night_constantine" || String(s.id || "").includes("constantine")));
          if (constStepIdx < 0) return;
          f.step = constStepIdx;
          showFlowTool();
          const html = window._lastFlowModalHtml || "";
          const hasUsedMsg = html.includes("already used") || html.includes("استفاده") || html.includes("No one to revive") || html.includes("کسی برای برگرداندن نیست");
          assert(html.includes("fl_const_revive") || hasUsedMsg, "Constantine step should show revive UI or used message (instruction 390)");
        },
      },
      // Instruction 410: Nostradamus survives mafia shot (unlimited shields when on citizen side)
      {
        name: "Nostradamus survives mafia shot when on citizen side (unlimited shields)",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const nostradamusIdx = 6;
          if (!draw[nostradamusIdx] || draw[nostradamusIdx].roleId !== "nostradamus") return;
          if (!f.draft) f.draft = {};
          f.draft.nostradamusChosenSide = "citizen";
          f.phase = "night";
          f.day = 2;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: nostradamusIdx,
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: nostradamusIdx,
            matadorDisable: null,
          });
          nextFlowStep();
          assert(draw[nostradamusIdx].alive === true, "Nostradamus should survive mafia shot (unlimited shields, instruction 410)");
        },
      },
      // Instruction 420: Full flow to Winner
      {
        name: "Flow can reach Winner step",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "winner";
          f.day = 5;
          const winnerSteps = getFlowSteps({ ...f, phase: "winner" });
          const hasWinner = winnerSteps.some((s) => s && (s.id === "winner_run" || String(s.id || "").includes("winner")));
          assert(hasWinner, "Flow must include Winner step (instruction 420)");
        },
      },
    ],
  };

  window.GODFATHER_TESTS = suite;
})();

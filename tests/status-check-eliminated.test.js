/**
 * Tests that Status Check always shows eliminated players, regardless of how
 * they died (vote, Sixth Sense, mafia shot, etc.).
 * Also tests Night 3 Status Check shows Eliminated, Revived, and Role Switched
 * when Saul Buy succeeds (design/godfather_test_instructions.md instruction 375).
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupPedarkhande() {
    appState.ui.scenario = "pedarkhande";
    appState.draw = {
      players: [
        { roleId: "godfather", alive: true },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: true },
        { roleId: "citizenKane", alive: true },
        { roleId: "constantine", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  // Full pedarkhande: godfather=0, matador=1, watson=2, leon=3, citizenKane=4, constantine=5, nostradamus=6, saul=7, citizen=8, citizen=9
  // Night 3: Saul bought citizen 8 (role switched), Leon shot citizen 9 (Leon dies), Constantine revived Kane
  function setupPedarkhandeNight3StatusCheck() {
    appState.ui.scenario = "pedarkhande";
    appState.draw = {
      players: [
        { roleId: "godfather", alive: true },
        { roleId: "matador", alive: false },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: false },
        { roleId: "citizenKane", alive: true },
        { roleId: "constantine", alive: true },
        { roleId: "nostradamus", alive: true },
        { roleId: "saulGoodman", alive: true },
        { roleId: "mafia", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    const f = ensureFlow();
    f.day = 3;
    f.phase = "night";
    f.draft = f.draft || {};
    f.draft.nightSaulBuyAppliedByDay = f.draft.nightSaulBuyAppliedByDay || {};
    f.draft.nightProAppliedByDay = f.draft.nightProAppliedByDay || {};
    f.draft.nightConstantineAppliedByDay = f.draft.nightConstantineAppliedByDay || {};
    f.draft.nightSaulBuyAppliedByDay["3"] = { converted: 8, prevRoleId: "citizen" };
    f.draft.nightProAppliedByDay["3"] = { killed: 3, prevAlive: true, result: "killed_self", shooter: 3, target: 9 };
    f.draft.nightConstantineAppliedByDay["3"] = { revived: 4, prevAlive: false };
    f.events = f.events || [];
    f.events.push({ kind: "night_actions", phase: "night", day: 3, data: { godfatherAction: "saul_buy", saulBuyTarget: 8 } });
    return f;
  }

  const suite = {
    name: "status-check-eliminated",
    tests: [
      {
        name: "Sixth Sense eliminated player appears in Status Check",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          if (typeof wouldStatusCheckShowEliminated !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const watsonIdx = 1;
          if (!draw[watsonIdx] || draw[watsonIdx].roleId !== "watson") return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "sixth_sense",
            sixthSenseTarget: watsonIdx,
            sixthSenseRole: "watson",
            matadorDisable: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "sixth_sense",
            sixthSenseTarget: watsonIdx,
            sixthSenseRole: "watson",
            matadorDisable: null,
          });

          nextFlowStep(); // Night 1 -> Day 2: night resolution applies Sixth Sense kill

          assert(draw[watsonIdx].alive === false, "Watson should be eliminated");
          assert(
            wouldStatusCheckShowEliminated(f, watsonIdx),
            "Status Check UI must show Sixth Sense eliminated player (Watson) in Eliminated list"
          );
        },
      },
      {
        name: "Vote-out eliminated player appears in Status Check",
        fn: function ({ assert }) {
          if (typeof wouldStatusCheckShowEliminated !== "function") return;
          appState.ui.scenario = "classic";
          appState.draw = {
            players: [
              { roleId: "mafiaBoss", alive: true },
              { roleId: "citizen", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "classic" },
          };
          const f = ensureFlow();
          f.phase = "day";
          f.day = 1;
          f.draft = f.draft || {};
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          const votedOutIdx = 1;
          f.draft.dayElimAppliedByDay["1"] = { out: votedOutIdx, prevAlive: true };
          f.events = f.events || [];
          f.events.push({ kind: "day_elim", phase: "day", day: 1, data: { out: votedOutIdx } });
          setPlayerLife(votedOutIdx, { alive: false, reason: "vote" });

          assert(
            wouldStatusCheckShowEliminated(f, votedOutIdx),
            "Status Check UI must show voted-out player in Eliminated list"
          );
        },
      },
      {
        name: "Mafia shot eliminated player appears in Status Check",
        fn: function ({ assert }) {
          if (typeof wouldStatusCheckShowEliminated !== "function") return;
          appState.ui.scenario = "classic";
          appState.draw = {
            players: [
              { roleId: "mafiaBoss", alive: true },
              { roleId: "citizen", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "classic" },
          };
          const f = ensureFlow();
          f.phase = "night";
          f.day = 1;
          f.draft = f.draft || {};
          f.draft.nightMafiaAppliedByDay = f.draft.nightMafiaAppliedByDay || {};
          const killedIdx = 1;
          f.draft.nightMafiaAppliedByDay["1"] = { killed: killedIdx, prevAlive: true };
          f.events = f.events || [];
          f.events.push({ kind: "night_actions", phase: "night", day: 1, data: { mafiaShot: killedIdx } });
          setPlayerLife(killedIdx, { alive: false, reason: "shot" });

          assert(
            wouldStatusCheckShowEliminated(f, killedIdx),
            "Status Check UI must show mafia shot victim in Eliminated list"
          );
        },
      },
      {
        name: "Status Check Night 3 shows Eliminated, Revived, Changed Roles when Saul Buy succeeds",
        fn: function ({ assert }) {
          if (typeof getEliminatedForStatusCheck !== "function") return;
          if (typeof getRevivedForStatusCheck !== "function") return;
          if (typeof getChangedRolesForStatusCheck !== "function") return;
          const f = setupPedarkhandeNight3StatusCheck();
          const leonIdx = 3;
          const kaneIdx = 4;
          const saulBoughtIdx = 8;

          const eliminated = getEliminatedForStatusCheck(f, 3, "night");
          const revived = getRevivedForStatusCheck(f, 3, "night");
          const changedRoles = getChangedRolesForStatusCheck(f, 3, "night");
          const saulBuyEntry = changedRoles.find((e) => e.type === "saul_buy" && e.idx === saulBoughtIdx);

          assert(eliminated.includes(leonIdx), "Status Check Night 3 must show Eliminated: Leon (shot citizen, died)");
          assert(revived.includes(kaneIdx), "Status Check Night 3 must show Revived: Citizen Kane");
          assert(saulBuyEntry != null, "Status Check Night 3 must show Changed Roles: citizen Saul bought");
        },
      },
      {
        name: "Dawn resolution is first step on Day 2+",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "day";
          f.day = 2;
          const steps = getFlowSteps(f);
          const first = steps[0];
          assert(first && first.id === "day_dawn_resolution", "Day 2 first step must be day_dawn_resolution");
        },
      },
      {
        name: "Dusk resolution is last step on Day 2+",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupPedarkhande();
          f.phase = "day";
          f.day = 2;
          const steps = getFlowSteps(f);
          const last = steps[steps.length - 1];
          assert(last && last.id === "day_dusk_resolution", "Day 2 last step must be day_dusk_resolution");
        },
      },
    ],
  };

  window.STATUS_CHECK_ELIMINATED_TESTS = suite;
})();

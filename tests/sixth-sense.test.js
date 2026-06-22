/**
 * Tests that when the Godfather's Sixth Sense guess is correct, the target
 * player is eliminated at the start of day.
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

  const suite = {
    name: "sixth-sense",
    tests: [
      {
        name: "Sixth Sense correct guess: target is eliminated at start of day",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
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

          assert(draw[watsonIdx].alive === false, "Watson should be eliminated when Godfather correctly guessed their role");
        },
      },
    ],
  };

  window.SIXTH_SENSE_TESTS = suite;
})();

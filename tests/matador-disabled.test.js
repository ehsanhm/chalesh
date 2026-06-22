/**
 * Tests that when a role is disabled by the Matador (or Magician), all actions
 * for that role are disabled — the moderator cannot select them, and they are
 * cleared during night resolution.
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  // Indices: godfather=0, matador=1, watson=2, leon=3, citizenKane=4, constantine=5, citizen=6
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
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  const suite = {
    name: "matador-disabled",
    tests: [
      {
        name: "Matador-disabled Watson: doctorSave is cleared during night resolution",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const watsonIdx = 2;
          const victimIdx = 6;
          if (!draw[victimIdx] || !draw[watsonIdx]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            matadorDisable: watsonIdx,
            doctorSave: victimIdx,
            mafiaShot: victimIdx,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            matadorDisable: watsonIdx,
            doctorSave: victimIdx,
            mafiaShot: victimIdx,
          });

          nextFlowStep();

          assert(draw[victimIdx].alive === false, "Mafia shot target should die when Watson is disabled (Watson cannot save)");
        },
      },
      {
        name: "Matador 24h: Watson disabled in Night 1 can act in Night 2 (24h passed)",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const watsonIdx = 2;
          const victimIdx = 6;
          if (!draw[victimIdx] || !draw[watsonIdx]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            matadorDisable: watsonIdx,
            mafiaShot: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            matadorDisable: watsonIdx,
            mafiaShot: null,
          });
          nextFlowStep();

          f.phase = "night";
          f.day = 2;
          const nightSteps2 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps2.length - 1);
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            matadorDisable: null,
            doctorSave: victimIdx,
            mafiaShot: victimIdx,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            matadorDisable: null,
            doctorSave: victimIdx,
            mafiaShot: victimIdx,
          });

          nextFlowStep();

          assert(draw[victimIdx].alive === true, "Watson can save in Night 2 after 24h since disable (Matador effect lasts one night only)");
        },
      },
    ],
  };

  window.MATADOR_DISABLED_TESTS = suite;
})();

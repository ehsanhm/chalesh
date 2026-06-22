/**
 * Tests that when moderator kills someone (mafia shot) and advances to the next phase,
 * going back reverts the death and the person becomes alive again.
 *
 * Covers all scenarios with flow configs: classic, zodiac, bazras, namayande, kabo, pedarkhande.
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  const SCENARIOS = ["classic", "zodiac", "bazras", "namayande", "kabo", "pedarkhande"];

  function getMinimalDraw(scenarioId) {
    const base = [
      { roleId: "mafiaBoss", alive: true },
      { roleId: "doctor", alive: true },
      { roleId: "detective", alive: true },
      { roleId: "citizen", alive: true },
      { roleId: "citizen", alive: true },
    ];
    if (scenarioId === "pedarkhande") {
      return [
        { roleId: "godfather", alive: true },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ];
    }
    if (scenarioId === "namayande") {
      return [
        { roleId: "don", alive: true },
        { roleId: "doctor", alive: true },
        { roleId: "guide", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ];
    }
    if (scenarioId === "kabo") {
      return [
        { roleId: "danMafia", alive: true },
        { roleId: "detective", alive: true },
        { roleId: "heir", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ];
    }
    if (scenarioId === "zodiac") {
      return [
        { roleId: "alcapone", alive: true },
        { roleId: "doctor", alive: true },
        { roleId: "detective", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ];
    }
    return base;
  }

  function setupScenario(scenarioId) {
    appState.ui.scenario = scenarioId;
    appState.draw = {
      players: getMinimalDraw(scenarioId),
      uiAtDraw: { scenario: scenarioId },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  function advanceToDay2(f) {
    const maxSteps = 50;
    let count = 0;
    while (count < maxSteps && (f.phase !== "day" || f.day !== 2)) {
      nextFlowStep();
      count++;
    }
    return f.phase === "day" && f.day === 2;
  }

  const suite = {
    name: "revert-death",
    tests: SCENARIOS.map((scenarioId) => ({
      name: scenarioId + ": mafia shot victim becomes alive when going back from Day 2 to Night 1",
      fn: function ({ assert, assertEqual }) {
        if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
        const flowCfg = typeof getFlowConfig === "function" ? getFlowConfig(scenarioId) : null;
        if (!flowCfg || !flowCfg.night) return;

        const f = setupScenario(scenarioId);
        const draw = appState.draw.players;
        const victimIdx = 3;
        if (!draw[victimIdx]) return;

        f.phase = "night";
        f.day = 1;
        const nightSteps = getFlowSteps({ ...f, phase: "night" });
        f.step = Math.max(0, nightSteps.length - 1);

        if (!f.draft) f.draft = {};
        f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
        f.draft.nightActionsByNight["1"] = { mafiaShot: victimIdx };
        addFlowEvent("night_actions", { mafiaShot: victimIdx });

        nextFlowStep();
        const reachedDay2 = f.phase === "day" && f.day === 2;
        if (!reachedDay2) return;

        assert(draw[victimIdx].alive === false, scenarioId + ": victim should be dead after night resolution");

        prevFlowStep();

        assert(draw[victimIdx].alive !== false, scenarioId + ": victim should be alive again after going back");
      },
    })),
  };

  window.REVERT_DEATH_TESTS = suite;
})();

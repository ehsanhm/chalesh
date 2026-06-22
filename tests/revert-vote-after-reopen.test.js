/**
 * Tests that when moderator votes someone out, advances to next phase, closes flow window,
 * reopens flow window, and goes back to previous phases/steps, the voted-out person becomes alive again.
 *
 * Simulates: vote out -> next phase -> save (close) -> restore (reopen) -> prevFlowStep -> victim alive.
 *
 * Covers all scenarios: classic, zodiac, bazras, namayande, kabo, pedarkhande.
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

  function getDay2Steps(scenarioId) {
    if (scenarioId === "namayande") {
      return ["namayande_rep_action", "namayande_cover", "namayande_defense", "namayande_vote"];
    }
    return ["day_vote", "day_elim"];
  }

  function getElimStepId(scenarioId) {
    return scenarioId === "namayande" ? "namayande_vote" : "day_elim";
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

  const suite = {
    name: "revert-vote-after-reopen",
    tests: [
      // Same-day back: vote out → Back to day_vote/defense step → victim must be alive (user-reported bug)
      ...SCENARIOS.map((scenarioId) => ({
        name: scenarioId + ": voted-out person alive when going back from day_elim to day_vote (same day)",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function") return;
          if (typeof applyEffect !== "function" || typeof hasEffect !== "function") return;
          const flowCfg = typeof getFlowConfig === "function" ? getFlowConfig(scenarioId) : null;
          if (!flowCfg) return;

          const f = setupScenario(scenarioId);
          const draw = appState.draw.players;
          const victimIdx = 3;
          if (!draw[victimIdx]) return;

          const day2Steps = getDay2Steps(scenarioId);
          const elimStepId = getElimStepId(scenarioId);
          const elimStepIndex = day2Steps.indexOf(elimStepId);
          if (elimStepIndex < 0) return;

          f.phase = "day";
          f.day = 2;
          f.step = elimStepIndex;
          if (!f.draft) f.draft = {};
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["2"] = day2Steps;
          // Set vote candidates so day_elim has context
          f.draft.voteCandidatesByDay = f.draft.voteCandidatesByDay || {};
          f.draft.voteCandidatesByDay["2"] = [victimIdx];
          f.draft.elimCandidatesByDay = f.draft.elimCandidatesByDay || {};
          f.draft.elimCandidatesByDay["2"] = [victimIdx];

          const applied = hasEffect(elimStepId)
            ? applyEffect(elimStepId, { f, payload: { out: victimIdx } })
            : (typeof applyDayElimFromPayload === "function" && applyDayElimFromPayload(f, { out: victimIdx }));
          if (!applied) return;

          assert(draw[victimIdx].alive === false, scenarioId + ": victim should be dead after vote-out");

          prevFlowStep();

          const draw2 = appState.draw && appState.draw.players ? appState.draw.players : draw;
          assert(draw2[victimIdx].alive !== false, scenarioId + ": victim should be alive when back on day_vote (select-defenders)");
        },
      })),
      ...SCENARIOS.map((scenarioId) => ({
        name: scenarioId + ": voted-out person becomes alive after close/reopen and going back",
        fn: function ({ assert }) {
        if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof saveState !== "function") return;
        if (typeof applyEffect !== "function" || typeof hasEffect !== "function") return;
        const flowCfg = typeof getFlowConfig === "function" ? getFlowConfig(scenarioId) : null;
        if (!flowCfg) return;

        const f = setupScenario(scenarioId);
        const draw = appState.draw.players;
        const victimIdx = 3;
        if (!draw[victimIdx]) return;

        const day2Steps = getDay2Steps(scenarioId);
        const elimStepId = getElimStepId(scenarioId);
        const elimStepIndex = day2Steps.indexOf(elimStepId);
        if (elimStepIndex < 0) return;

        f.phase = "day";
        f.day = 2;
        f.step = elimStepIndex;
        if (!f.draft) f.draft = {};
        f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
        f.draft.dayStepsByDay["2"] = day2Steps;

        const applied = hasEffect(elimStepId)
          ? applyEffect(elimStepId, { f, payload: { out: victimIdx } })
          : (typeof applyDayElimFromPayload === "function" && applyDayElimFromPayload(f, { out: victimIdx }));
        if (!applied) return;

        assert(draw[victimIdx].alive === false, scenarioId + ": victim should be dead after vote-out");

        nextFlowStep();

        saveState(appState);

        if (window._persistedState) {
          appState = JSON.parse(JSON.stringify(window._persistedState));
        }
        const f2 = ensureFlow();

        prevFlowStep();

        const draw2 = appState.draw && appState.draw.players ? appState.draw.players : draw;
        assert(draw2[victimIdx].alive !== false, scenarioId + ": victim should be alive again after reopen and going back");
      },
    })),
  };

  window.REVERT_VOTE_AFTER_REOPEN_TESTS = suite;
})();

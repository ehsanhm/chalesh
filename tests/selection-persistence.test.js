/**
 * Tests that moderator selections persist when:
 * - Navigating back and forth between phases/sub-steps
 * - Simulating close Flow window and reopen (save/restore state)
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupClassicFlow() {
    appState.ui.scenario = "classic";
    appState.draw.uiAtDraw = appState.draw.uiAtDraw || {};
    appState.draw.uiAtDraw.scenario = "classic";
    appState.draw.players = [
      { roleId: "mafiaBoss", alive: true },
      { roleId: "detective", alive: true },
      { roleId: "doctor", alive: true },
      { roleId: "citizen", alive: true },
      { roleId: "citizen", alive: true },
    ];
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  const suite = {
    name: "selection-persistence",
    tests: [
      {
        name: "challengeUsedByDay and voteCandidatesByDay persist when going back from day_elim to day_vote",
        fn: function ({ assert, assertDeepEqual }) {
          if (typeof prevFlowStep !== "function" || typeof ensureFlow !== "function") return;

          const f = setupClassicFlow();
          f.phase = "day";
          f.day = 1;
          f.step = 1; // day_elim
          if (!f.draft) f.draft = {};
          f.draft.challengeUsedByDay = f.draft.challengeUsedByDay || {};
          f.draft.challengeUsedByDay["1"] = [0, 2];
          f.draft.voteCandidatesByDay = f.draft.voteCandidatesByDay || {};
          f.draft.voteCandidatesByDay["1"] = [0, 1, 2];

          prevFlowStep(); // back to day_vote

          assertDeepEqual(f.draft.challengeUsedByDay["1"], [0, 2], "challengeUsedByDay should persist");
          assertDeepEqual(f.draft.voteCandidatesByDay["1"], [0, 1, 2], "voteCandidatesByDay should persist");
        },
      },
      {
        name: "challengeUsedByDay and voteCandidatesByDay persist when going back then forward (day_vote <-> day_elim)",
        fn: function ({ assert, assertDeepEqual }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function") return;

          const f = setupClassicFlow();
          f.phase = "day";
          f.day = 1;
          f.step = 1;
          if (!f.draft) f.draft = {};
          f.draft.challengeUsedByDay = { "1": [0, 2] };
          f.draft.voteCandidatesByDay = { "1": [0, 1, 2] };

          prevFlowStep(); // -> day_vote
          assertDeepEqual(f.draft.challengeUsedByDay["1"], [0, 2]);
          assertDeepEqual(f.draft.voteCandidatesByDay["1"], [0, 1, 2]);

          nextFlowStep(); // -> day_elim
          assertDeepEqual(f.draft.challengeUsedByDay["1"], [0, 2]);
          assertDeepEqual(f.draft.voteCandidatesByDay["1"], [0, 1, 2]);
        },
      },
      {
        name: "nightActionsByNight persists when navigating between night steps",
        fn: function ({ assert, assertEqual }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function") return;

          const f = setupClassicFlow();
          f.phase = "night";
          f.day = 1;
          f.step = 0; // night_mafia
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: 2 };

          nextFlowStep(); // -> night_doctor
          prevFlowStep(); // -> night_mafia

          assert(f.draft.nightActionsByNight["1"], "nightActionsByNight[1] should exist");
          assertEqual(f.draft.nightActionsByNight["1"].mafiaShot, 2, "mafiaShot should persist");
        },
      },
      {
        name: "endCardActionByDay persists when going back from end card step then forward again",
        fn: function ({ assert, assertEqual }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof getFlowSteps !== "function") return;

          appState.ui.scenario = "pedarkhande";
          appState.draw = {
            players: [
              { roleId: "godfather", alive: true },
              { roleId: "detective", alive: true },
              { roleId: "doctor", alive: true },
              { roleId: "nostradamus", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "pedarkhande" },
          };
          appState.draw.players[1].alive = false;
          appState.god = appState.god || {};
          appState.god.flow = {
            phase: "day",
            day: 1,
            step: 0,
            events: [{ kind: "day_elim_out", phase: "day", day: 1, data: { out: 1 } }],
            draft: {},
          };
          appState.god.endCards = { byDay: { "1": { out: 1, cardId: "beautiful_mind", at: Date.now() } }, used: ["beautiful_mind"] };

          const f = ensureFlow();
          if (!f.draft) f.draft = {};
          f.draft.endCardActionByDay = { "1": { target: 2 } };

          const steps = getFlowSteps(f);
          const endCardIdx = steps.findIndex((s) => s && s.id === "day_end_card_beautiful_mind");
          if (endCardIdx < 0) return;

          f.step = endCardIdx;
          prevFlowStep();
          nextFlowStep();

          assert(f.draft.endCardActionByDay && f.draft.endCardActionByDay["1"], "endCardActionByDay[1] should exist");
          assertEqual(f.draft.endCardActionByDay["1"].target, 2, "Beautiful Mind target selection should persist after back then forward");
        },
      },
      {
        name: "selections persist after simulated close/reopen (save and restore state)",
        fn: function ({ assert, assertEqual, assertDeepEqual }) {
          if (typeof saveState !== "function" || typeof ensureFlow !== "function") return;

          const f = setupClassicFlow();
          f.phase = "day";
          f.day = 1;
          f.step = 1;
          if (!f.draft) f.draft = {};
          f.draft.challengeUsedByDay = { "1": [0, 2] };
          f.draft.voteCandidatesByDay = { "1": [0, 1, 2] };
          f.draft.nightActionsByNight = { "1": { mafiaShot: 2, doctorSave: 3 } };

          saveState(appState);

          // Simulate reopen: restore appState from persisted snapshot
          if (window._persistedState) {
            appState = JSON.parse(JSON.stringify(window._persistedState));
          }
          const f2 = ensureFlow();

          assertDeepEqual(f2.draft.challengeUsedByDay["1"], [0, 2], "challengeUsedByDay should persist after reopen");
          assertDeepEqual(f2.draft.voteCandidatesByDay["1"], [0, 1, 2], "voteCandidatesByDay should persist after reopen");
          assert(f2.draft.nightActionsByNight && f2.draft.nightActionsByNight["1"], "nightActionsByNight should persist");
          assertEqual(f2.draft.nightActionsByNight["1"].mafiaShot, 2);
          assertEqual(f2.draft.nightActionsByNight["1"].doctorSave, 3);
        },
      },
    ],
  };

  window.SELECTION_PERSISTENCE_TESTS = suite;
})();

/**
 * Scenario tests: Classic
 *
 * Draw (5 players):
 *   0 mafiaBoss  1 doctor  2 detective  3 citizen  4 citizen
 *
 * Night steps (3): night_mafia → night_doctor → night_detective
 * Day steps  (3 on Day 1): day_vote → day_elim → day_dusk_resolution
 *            (4 on Day 2): day_dawn_resolution → day_vote → day_elim → day_dusk_resolution
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  var DRAW = ["mafiaBoss", "doctor", "detective", "citizen", "citizen"];

  var suite = {
    name: "classic",
    tests: [
      {
        name: "Night 1: mafia kills citizen → citizen dead at Day 2",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("classic", DRAW);
          var victimIdx = 3;

          SH.atNight(f, 1, { mafiaShot: victimIdx, doctorSave: null, detectiveQuery: null });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2 after night resolution");
          t.assert(appState.draw.players[victimIdx].alive === false, "citizen (idx 3) must be dead after mafia shot");
          t.assert(appState.draw.players[0].alive !== false, "mafiaBoss must still be alive");
        },
      },
      {
        name: "Night 1: doctor saves mafia target → target survives",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("classic", DRAW);
          var victimIdx = 3;

          SH.atNight(f, 1, { mafiaShot: victimIdx, doctorSave: victimIdx, detectiveQuery: null });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          t.assert(appState.draw.players[victimIdx].alive !== false, "doctor save: target must be alive");
        },
      },
      {
        name: "Night 1: detective inquiry result stored",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("classic", DRAW);
          // Detective inquires about mafiaBoss (idx 0) — should return isMafia=false (boss shows as citizen to detective)
          SH.atNight(f, 1, { mafiaShot: null, doctorSave: null, detectiveQuery: 0 });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          var result = f.draft && f.draft.detectiveResultByNight && f.draft.detectiveResultByNight["1"];
          t.assert(result != null, "detectiveResultByNight[1] must be stored");
          t.assert(result.target === 0, "detective target must be mafiaBoss (idx 0)");
          // mafiaBoss shows as citizen (isMafia=false) in classic
          t.assert(result.isMafia === false, "mafiaBoss must show as citizen to detective (isMafia=false)");
        },
      },
      {
        name: "Back-nav Night 1: killed citizen revives when going back from Day 2",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function") return;
          var f = SH.setup("classic", DRAW);
          var victimIdx = 4;

          SH.atNight(f, 1, { mafiaShot: victimIdx, doctorSave: null, detectiveQuery: null });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(appState.draw.players[victimIdx].alive === false, "victim must be dead after night resolution");

          prevFlowStep(); // Day 2 (step 0: day_dawn_resolution) → Night 1 (last step)

          t.assert(f.phase === "night" && f.day === 1, "should be back on Night 1");
          t.assert(appState.draw.players[victimIdx].alive !== false, "victim must be revived after back-nav to Night 1");
        },
      },
      {
        name: "Day elim then back-nav: voted-out player revives on day_vote",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof prevFlowStep !== "function" || typeof applyDayElimFromPayload !== "function") return;
          var f = SH.setup("classic", DRAW);
          var victimIdx = 3;

          // Position on Day 1, day_elim step (step 1, after day_vote=step 0)
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          // Snapshot day steps so prevFlowStep knows what step list to use
          f.draft.dayStepsByDay = { "1": ["day_vote", "day_elim", "day_dusk_resolution"] };
          f.step = 1; // day_elim

          applyDayElimFromPayload(f, { out: victimIdx });
          t.assert(appState.draw.players[victimIdx].alive === false, "victim must be dead after day_elim");

          prevFlowStep(); // day_elim → day_vote (reverts elim)

          t.assert(f.step === 0, "should be back on step 0 (day_vote)");
          t.assert(appState.draw.players[victimIdx].alive !== false, "victim must be revived after back-nav from day_elim");
        },
      },
    ],
  };

  window.CLASSIC_TESTS = suite;
})();

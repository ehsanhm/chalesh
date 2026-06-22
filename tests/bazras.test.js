/**
 * Scenario tests: Bazras (Inspector)
 *
 * Draw (8 players):
 *   0 mafiaBoss  1 swindler  2 researcher  3 investigator
 *   4 doctor     5 detective  6 citizen     7 citizen
 *
 * Night steps (6, sniper not in draw):
 *   night_researcher → night_mafia → night_swindler →
 *   night_doctor → night_detective → night_inspector
 *
 * Special rules tested:
 *   - Interrogation sub-steps (bazras_interrogation, bazras_midday, bazras_forced_vote)
 *     appear on Day 2 when inspector picked two players who both survived Night 1.
 *   - No interrogation when one of the inspector's targets dies at night.
 *   - Sniper shooting mafiaBoss → no kill (bazras rule).
 *   - Researcher chain kill: mafia kills researcher (linked to swindler) → swindler dies too.
 *   - Back-nav reverts researcher chain kill.
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  var DRAW = ["mafiaBoss", "swindler", "researcher", "investigator", "doctor", "detective", "citizen", "citizen"];

  var suite = {
    name: "bazras",
    tests: [
      {
        name: "Interrogation steps appear when inspector's 2 targets both survive Night 1",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("bazras", DRAW);

          // Simulate Night 1: inspector picks targets 6 and 7 (two citizens), mafia kills nobody
          f.phase = "day";
          f.day = 2;
          if (!f.draft) f.draft = {};
          // Store investigator targets from Night 1 (prevNightKey = "1")
          f.draft.investigatorTargetsByNight = { "1": { t1: 6, t2: 7 } };
          // Both targets alive (default from SH.setup)

          var ids = SH.stepIds(f);
          // Dawn resolution prepended for Day 2
          t.assert(ids.indexOf("day_dawn_resolution") >= 0, "dawn resolution must appear on Day 2");
          t.assert(ids.indexOf("bazras_interrogation") >= 0, "bazras_interrogation must appear when both targets alive");
          t.assert(ids.indexOf("bazras_midday") >= 0, "bazras_midday must appear");
          t.assert(ids.indexOf("bazras_forced_vote") >= 0, "bazras_forced_vote must appear");
          t.assert(ids.indexOf("day_vote") >= 0, "day_vote must appear after interrogation");
          t.assert(ids.indexOf("day_elim") >= 0, "day_elim must appear");
          // Verify order: interrogation steps come before day_vote
          t.assert(
            ids.indexOf("bazras_interrogation") < ids.indexOf("day_vote"),
            "interrogation must come before day_vote"
          );
        },
      },
      {
        name: "No interrogation when one inspector target dies at night",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("bazras", DRAW);

          // Inspector picks targets 6 and 7, but target 6 dies at night (mafia shot)
          appState.draw.players[6].alive = false;

          f.phase = "day";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.investigatorTargetsByNight = { "1": { t1: 6, t2: 7 } };

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("bazras_interrogation") < 0, "no interrogation when target 6 is dead");
          t.assert(ids.indexOf("day_vote") >= 0, "day_vote still appears");
          t.assert(ids.indexOf("day_elim") >= 0, "day_elim still appears");
        },
      },
      {
        name: "Sniper shoots mafiaBoss → mafiaBoss survives (bazras rule: no_effect_boss)",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          // Need sniper in draw for this test
          var drawWithSniper = ["mafiaBoss", "swindler", "researcher", "investigator", "doctor", "detective", "sniper", "citizen"];
          var f = SH.setup("bazras", drawWithSniper);
          var sniperIdx = 6;

          // Night 1: sniper shoots mafiaBoss (idx 0)
          SH.atNight(f, 1, {
            mafiaShot: null,
            doctorSave: null,
            detectiveQuery: null,
            sniperShot: 0, // shoot mafiaBoss
            researcherLink: null,
            investigatorT1: null,
            investigatorT2: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          t.assert(appState.draw.players[0].alive !== false, "mafiaBoss must survive sniper shot in bazras");
          t.assert(appState.draw.players[sniperIdx].alive !== false, "sniper must also survive (no self-kill for boss target in bazras)");

          // Verify result stored as no_effect_boss
          var rec = f.draft && f.draft.nightSniperAppliedByDay && f.draft.nightSniperAppliedByDay["1"];
          t.assert(rec != null && rec.result === "no_effect_boss", "sniper result must be no_effect_boss");
        },
      },
      {
        name: "Researcher chain kill: mafia kills researcher (linked to swindler) → swindler also dies",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("bazras", DRAW);
          var researcherIdx = 2;
          var swindlerIdx = 1;

          // Night 1: mafia kills researcher (idx 2), researcher linked to swindler (idx 1)
          SH.atNight(f, 1, {
            mafiaShot: researcherIdx,
            doctorSave: null,
            detectiveQuery: null,
            researcherLink: swindlerIdx,
            sniperShot: null,
            investigatorT1: null,
            investigatorT2: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          t.assert(appState.draw.players[researcherIdx].alive === false, "researcher must be dead (mafia shot)");
          t.assert(appState.draw.players[swindlerIdx].alive === false, "swindler must be dead (researcher chain kill)");
          t.assert(appState.draw.players[0].alive !== false, "mafiaBoss must still be alive");
        },
      },
      {
        name: "Back-nav Night 1: researcher chain kill reverted (researcher and swindler revive)",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function") return;
          var f = SH.setup("bazras", DRAW);
          var researcherIdx = 2;
          var swindlerIdx = 1;

          SH.atNight(f, 1, {
            mafiaShot: researcherIdx,
            doctorSave: null,
            detectiveQuery: null,
            researcherLink: swindlerIdx,
            sniperShot: null,
            investigatorT1: null,
            investigatorT2: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(appState.draw.players[researcherIdx].alive === false, "researcher dead before back-nav");
          t.assert(appState.draw.players[swindlerIdx].alive === false, "swindler dead before back-nav");

          prevFlowStep(); // Day 2 (step 0: dawn) → Night 1 (last step)

          t.assert(f.phase === "night" && f.day === 1, "should be back on Night 1");
          t.assert(appState.draw.players[researcherIdx].alive !== false, "researcher must revive after back-nav");
          t.assert(appState.draw.players[swindlerIdx].alive !== false, "swindler must revive after back-nav (chain kill reverted)");
        },
      },
    ],
  };

  window.BAZRAS_TESTS = suite;
})();

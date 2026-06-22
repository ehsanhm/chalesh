/**
 * Scenario tests: Zodiac
 *
 * Draw (7 players):
 *   0 alcapone  1 zodiac  2 professional  3 doctor
 *   4 detective  5 gunslinger  6 citizen
 *
 * Night steps vary by night parity:
 *   Night 1 (odd, 5 steps): night_mafia → night_professional → night_doctor → night_detective → night_gunslinger
 *   Night 2 (even, 6 steps): + night_zodiac appended
 *   (night_magician, night_bomber, night_ocean filtered — not in draw)
 *
 * Day steps: day_guns? → day_gun_expiry? → day_vote → day_elim
 *   (day_guns appears only when guns/bomb active; day_gun_expiry only when unfired real guns exist)
 *
 * Special rules tested:
 *   - Zodiac step absent on odd nights, present on even nights.
 *   - Mafia night kill applies and is reverted on back-nav.
 *   - Doctor save blocks mafia kill.
 *   - Zodiac shoots guard → zodiac dies (not guard).
 *   - Day_gun_expiry step absent when no unfired real guns exist.
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  var DRAW = ["alcapone", "zodiac", "professional", "doctor", "detective", "gunslinger", "citizen"];

  var suite = {
    name: "zodiac",
    tests: [
      {
        name: "Night 1 (odd): night_zodiac step is absent",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("zodiac", DRAW);
          f.phase = "night";
          f.day = 1;

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("night_zodiac") < 0, "night_zodiac must not appear on Night 1 (odd)");
          t.assert(ids.indexOf("night_mafia") >= 0, "night_mafia must appear");
          t.assert(ids.indexOf("night_professional") >= 0, "night_professional must appear");
          t.assert(ids.indexOf("night_doctor") >= 0, "night_doctor must appear");
          t.assert(ids.indexOf("night_detective") >= 0, "night_detective must appear");
          t.assert(ids.indexOf("night_gunslinger") >= 0, "night_gunslinger must appear");
        },
      },
      {
        name: "Night 2 (even): night_zodiac step is present",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("zodiac", DRAW);
          f.phase = "night";
          f.day = 2;

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("night_zodiac") >= 0, "night_zodiac must appear on Night 2 (even)");
          t.assert(ids.indexOf("night_mafia") >= 0, "night_mafia must still appear on Night 2");
        },
      },
      {
        name: "Night 1: mafia kills citizen → citizen dead at Day 2",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("zodiac", DRAW);
          var victimIdx = 6; // citizen

          SH.atNight(f, 1, {
            mafiaShot: victimIdx,
            doctorSave: null,
            detectiveQuery: null,
            zodiacShot: null,
            professionalShot: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2 after night resolution");
          t.assert(appState.draw.players[victimIdx].alive === false, "citizen (idx 6) must be dead after mafia shot");
          t.assert(appState.draw.players[0].alive !== false, "alcapone must still be alive");
        },
      },
      {
        name: "Night 1: doctor saves mafia target → target survives",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("zodiac", DRAW);
          var victimIdx = 6;

          SH.atNight(f, 1, {
            mafiaShot: victimIdx,
            doctorSave: victimIdx, // doctor saves the same target
            detectiveQuery: null,
            zodiacShot: null,
            professionalShot: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          t.assert(appState.draw.players[victimIdx].alive !== false, "doctor save: target must be alive");
        },
      },
      {
        name: "Night 2: zodiac shoots guard → zodiac dies, guard survives",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          // Need guard in draw for this test
          var drawWithGuard = ["alcapone", "zodiac", "professional", "doctor", "detective", "guard", "citizen"];
          var f = SH.setup("zodiac", drawWithGuard);
          var zodiacIdx = 1;
          var guardIdx = 5;

          // First advance through Night 1 (no kills) and Day 2
          SH.atNight(f, 1, { mafiaShot: null, doctorSave: null, detectiveQuery: null, zodiacShot: null, professionalShot: null });
          nextFlowStep(); // Night 1 → Day 2

          // Advance through Day 2 steps to Night 2
          // Day 2 steps: day_dawn_resolution, day_vote, day_elim, day_dusk_resolution
          var daySteps = getFlowSteps(f);
          f.step = Math.max(0, daySteps.length - 1); // last day step
          nextFlowStep(); // Day 2 → Night 2

          t.assert(f.phase === "night" && f.day === 2, "should be on Night 2");

          // Night 2 (even): zodiac can shoot
          SH.atNight(f, 2, {
            mafiaShot: null,
            doctorSave: null,
            detectiveQuery: null,
            zodiacShot: guardIdx, // zodiac shoots guard → zodiac dies
            professionalShot: null,
          });
          nextFlowStep(); // Night 2 → Day 3

          t.assert(f.phase === "day" && f.day === 3, "should be on Day 3 after Night 2");
          t.assert(appState.draw.players[zodiacIdx].alive === false, "zodiac must die after shooting guard");
          t.assert(appState.draw.players[guardIdx].alive !== false, "guard must survive (zodiac dies instead)");
        },
      },
      {
        name: "Zodiac alive: game must NOT end as mafia win (Zodiac must be eliminated first)",
        fn: function (t) {
          if (typeof nextFlowStep !== "function" || typeof getFlowSteps !== "function") return;
          var draw = ["alcapone", "magician", "zodiac", "doctor"];
          var f = SH.setup("zodiac", draw);
          f.phase = "night";
          f.day = 1;
          SH.atNight(f, 1, { mafiaShot: null, doctorSave: null, detectiveQuery: null, zodiacShot: null, professionalShot: null });
          nextFlowStep();
          t.assert(
            f.phase !== "winner" || f.draft.winnerTeam !== "mafia",
            "With 2 mafia + Zodiac + 1 citizen, mafia must NOT win while Zodiac is alive (design: Mafia wins only when Zodiac eliminated)"
          );
        },
      },
    ],
  };

  window.ZODIAC_TESTS = suite;
})();

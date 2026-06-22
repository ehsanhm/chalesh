/**
 * Scenario tests: Takavar (Commando)
 *
 * Draw (8 players):
 *   0 mafiaBoss  1 nato  2 hostageTaker  3 guardian
 *   4 detective  5 commando  6 doctor  7 gunslinger
 *
 * Night steps (7):
 *   night_guardian → night_hostageTaker → night_mafia → night_detective →
 *   night_commando → night_doctor → night_gunner
 *
 * Day steps:
 *   day_guns (only when f.guns has usable holders) → day_gun_expiry (only when unfired real guns) →
 *   day_vote → day_elim
 *
 * Special rules tested:
 *   - All 7 night steps appear in correct order.
 *   - day_guns absent when f.guns is empty.
 *   - day_guns present when real gun holder alive.
 *   - day_guns present when fake gun holder alive (fake guns count as usable).
 *   - Mafia kills citizen at night.
 *   - NATO correct guess: target dies, no mafia shot.
 *   - NATO wrong guess: nobody dies, no mafia shot.
 *   - Back-nav reverts night kill.
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  var DRAW = ["mafiaBoss", "nato", "hostageTaker", "guardian", "detective", "commando", "doctor", "gunslinger"];

  var suite = {
    name: "takavar",
    tests: [
      {
        name: "Night 1: all 7 night steps appear in correct order",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("takavar", DRAW);
          f.phase = "night";
          f.day = 1;

          var ids = SH.stepIds(f);
          var guardian   = ids.indexOf("night_guardian");
          var hostage    = ids.indexOf("night_hostageTaker");
          var mafia      = ids.indexOf("night_mafia");
          var detective  = ids.indexOf("night_detective");
          var commando   = ids.indexOf("night_commando");
          var doctor     = ids.indexOf("night_doctor");
          var gunner     = ids.indexOf("night_gunner");

          t.assert(guardian  >= 0, "night_guardian must appear");
          t.assert(hostage   >= 0, "night_hostageTaker must appear");
          t.assert(mafia     >= 0, "night_mafia must appear");
          t.assert(detective >= 0, "night_detective must appear");
          t.assert(commando  >= 0, "night_commando must appear");
          t.assert(doctor    >= 0, "night_doctor must appear");
          t.assert(gunner    >= 0, "night_gunner must appear");

          t.assert(guardian < hostage,   "night_guardian before night_hostageTaker");
          t.assert(hostage  < mafia,     "night_hostageTaker before night_mafia");
          t.assert(mafia    < detective, "night_mafia before night_detective");
          t.assert(detective < commando, "night_detective before night_commando");
          t.assert(commando < doctor,    "night_commando before night_doctor");
          t.assert(doctor   < gunner,    "night_doctor before night_gunner");
        },
      },
      {
        name: "Day 2: day_guns absent when f.guns is empty",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("takavar", DRAW);
          f.phase = "day";
          f.day = 2;
          f.guns = {};

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("day_guns") < 0, "day_guns must not appear when no guns");
          t.assert(ids.indexOf("day_vote") >= 0, "day_vote must appear");
          t.assert(ids.indexOf("day_elim") >= 0, "day_elim must appear");
        },
      },
      {
        name: "Day 2: day_guns present when real gun holder is alive",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("takavar", DRAW);
          f.phase = "day";
          f.day = 2;
          // Player 4 (detective) has the real gun
          f.guns = { 4: { type: "real", used: false, givenAt: 1 } };

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("day_guns") >= 0, "day_guns must appear when real gun holder alive");
        },
      },
      {
        name: "Day 2: day_guns present when fake gun holder is alive",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("takavar", DRAW);
          f.phase = "day";
          f.day = 2;
          // Player 5 (commando) has a fake gun
          f.guns = { 5: { type: "fake", used: false, givenAt: 1 } };

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("day_guns") >= 0, "day_guns must appear when fake gun holder alive");
        },
      },
      {
        name: "Day 2: day_guns absent when gun holder is dead",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("takavar", DRAW);
          f.phase = "day";
          f.day = 2;
          // Player 4 has gun but is dead
          appState.draw.players[4].alive = false;
          f.guns = { 4: { type: "real", used: false, givenAt: 1 } };

          var ids = SH.stepIds(f);
          t.assert(ids.indexOf("day_guns") < 0, "day_guns must not appear when only gun holder is dead");

          // Restore
          appState.draw.players[4].alive = true;
        },
      },
      {
        name: "Night 1: mafia kills citizen → dead at Day 2",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("takavar", DRAW);
          var victimIdx = 5; // commando

          SH.atNight(f, 1, {
            mafiaShot: victimIdx,
            doctorSave: null,
            detectiveQuery: null,
            godfatherAction: "shoot",
            natoTarget: null,
            natoRoleGuess: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2 after night resolution");
          t.assert(appState.draw.players[victimIdx].alive === false, "commando (idx 5) must be dead after mafia shot");
          t.assert(appState.draw.players[0].alive !== false, "mafiaBoss must still be alive");
        },
      },
      {
        name: "Night 1: doctor saves mafia target → target survives",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("takavar", DRAW);
          var victimIdx = 4; // detective

          SH.atNight(f, 1, {
            mafiaShot: victimIdx,
            doctorSave: victimIdx,
            detectiveQuery: null,
            godfatherAction: "shoot",
            natoTarget: null,
            natoRoleGuess: null,
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(appState.draw.players[victimIdx].alive !== false, "doctor save: target must survive");
        },
      },
      {
        name: "Night 1: NATO correct guess → target dies, no mafia shot",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("takavar", DRAW);
          // NATO (idx 1) guesses detective (idx 4) is "detective" — correct
          SH.atNight(f, 1, {
            mafiaShot: 6, // doctor — would be killed if NATO wasn't used
            doctorSave: null,
            detectiveQuery: null,
            godfatherAction: "nato_guess",
            natoTarget: 4,
            natoRoleGuess: "detective",
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          t.assert(appState.draw.players[4].alive === false, "detective (NATO correct guess) must be dead");
          t.assert(appState.draw.players[6].alive !== false, "doctor must be alive — mafia shot blocked by NATO");
        },
      },
      {
        name: "Night 1: NATO wrong guess → nobody dies",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function") return;
          var f = SH.setup("takavar", DRAW);
          // NATO guesses detective (idx 4) is "doctor" — wrong
          SH.atNight(f, 1, {
            mafiaShot: 6,
            doctorSave: null,
            detectiveQuery: null,
            godfatherAction: "nato_guess",
            natoTarget: 4,
            natoRoleGuess: "doctor",
          });
          nextFlowStep(); // Night 1 → Day 2

          t.assert(f.phase === "day" && f.day === 2, "should be on Day 2");
          t.assert(appState.draw.players[4].alive !== false, "detective (wrong guess) must be alive");
          t.assert(appState.draw.players[6].alive !== false, "doctor must be alive — mafia shot blocked by NATO");
        },
      },
      {
        name: "Back-nav Night 1: killed player revives when going back",
        fn: function (t) {
          if (typeof ensureFlow !== "function" || typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function") return;
          var f = SH.setup("takavar", DRAW);
          var victimIdx = 5; // commando

          SH.atNight(f, 1, {
            mafiaShot: victimIdx,
            doctorSave: null,
            detectiveQuery: null,
            godfatherAction: "shoot",
            natoTarget: null,
            natoRoleGuess: null,
          });
          nextFlowStep(); // Night 1 → Day 2
          t.assert(appState.draw.players[victimIdx].alive === false, "victim must be dead after night resolution");

          prevFlowStep(); // Day 2 → Night 1 (last night step)
          t.assert(f.phase === "night" && f.day === 1, "must be back on Night 1");
          t.assert(appState.draw.players[victimIdx].alive !== false, "victim must revive after back-nav");
        },
      },
    ],
  };

  window.TAKAVAR_TESTS = suite;
})();

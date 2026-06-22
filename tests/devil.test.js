/**
 * Scenario tests: Devil
 *
 * Devil is the app's Trouble Brewing-inspired script.
 * These tests cover the state-changing rules; information-role renderers
 * compute moderator-facing results from the current draw.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  var TROUBLE_BREWING_ROLE_IDS = [
    "devilWasherwoman", "devilLibrarian", "devilInvestigator", "devilChef", "devilEmpath", "devilFortuneTeller", "devilUndertaker",
    "devilMonk", "devilRavenkeeper", "devilVirgin", "devilSlayer", "devilSoldier", "devilMayor",
    "devilButler", "devilDrunk", "devilRecluse", "devilSaint",
    "devilPoisoner", "devilSpy", "devilScarletWoman", "devilBaron",
    "devilImp",
  ];

  var suite = {
    name: "devil",
    tests: [
      {
        name: "Role list includes every official Trouble Brewing character",
        fn: function (t) {
          var cfg = SCENARIO_CONFIGS && SCENARIO_CONFIGS.devil;
          t.assert(cfg, "Devil scenario config should exist");

          var missingRoles = TROUBLE_BREWING_ROLE_IDS.filter(function (rid) { return !roles[rid]; });
          var missingAllowed = TROUBLE_BREWING_ROLE_IDS.filter(function (rid) { return cfg.allowedRoles.indexOf(rid) < 0; });
          var missingI18n = TROUBLE_BREWING_ROLE_IDS.filter(function (rid) { return !ROLE_I18N[rid]; });
          var extraAllowed = cfg.allowedRoles.filter(function (rid) { return TROUBLE_BREWING_ROLE_IDS.indexOf(rid) < 0; });

          t.assert(!missingRoles.length, "missing role definitions: " + missingRoles.join(", "));
          t.assert(!missingAllowed.length, "missing allowed roles: " + missingAllowed.join(", "));
          t.assert(!missingI18n.length, "missing English labels: " + missingI18n.join(", "));
          t.assert(!extraAllowed.length, "unexpected non-script roles in Devil setup: " + extraAllowed.join(", "));

          var counts = TROUBLE_BREWING_ROLE_IDS.reduce(function (acc, rid) {
            var type = roles[rid] && roles[rid].botcType;
            acc[type] = (acc[type] || 0) + 1;
            return acc;
          }, {});
          t.assertEqual(counts.townsfolk, 13, "Trouble Brewing should have 13 Townsfolk");
          t.assertEqual(counts.outsider, 4, "Trouble Brewing should have 4 Outsiders");
          t.assertEqual(counts.minion, 4, "Trouble Brewing should have 4 Minions");
          t.assertEqual(counts.demon, 1, "Trouble Brewing should have 1 Demon");
        },
      },
      {
        name: "Scenario guide is available for Devil",
        fn: function (t) {
          t.assert(typeof SCENARIO_GUIDES !== "undefined", "scenario guides should be loaded");
          t.assert(SCENARIO_GUIDES.devil, "Devil guide should exist");
          t.assert(SCENARIO_GUIDES.devil.en && SCENARIO_GUIDES.devil.en.indexOf("Regular Night Order") >= 0, "English Devil guide should include night order");
          t.assert(SCENARIO_GUIDES.devil.fa && SCENARIO_GUIDES.devil.fa.indexOf("ترتیب شب") >= 0, "Persian Devil guide should include night order");
        },
      },
      {
        name: "Night steps only include roles in the Devil draw",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilMonk", "devilFortuneTeller", "devilTownsfolk"]);
          f.phase = "night";
          f.day = 1;
          var ids = SH.stepIds(f);

          t.assert(ids.indexOf("devil_night_poisoner") >= 0, "Poisoner step should appear");
          t.assert(ids.indexOf("devil_night_monk") >= 0, "Monk step should appear");
          t.assert(ids.indexOf("devil_night_imp") >= 0, "Imp step should appear");
          t.assert(ids.indexOf("devil_night_fortune_teller") >= 0, "Fortune Teller step should appear");
          t.assert(ids.indexOf("devil_night_ravenkeeper") < 0, "Ravenkeeper step should be skipped when absent");
          t.assert(ids.indexOf("devil_night_scarlet_woman") < 0, "Scarlet Woman step should be skipped when absent");
          t.assert(ids.indexOf("devil_night_spy") < 0, "Spy step should be skipped when absent");
        },
      },
      {
        name: "Intro night follows Trouble Brewing first-night order",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("devil", [
            "devilImp", "devilPoisoner", "devilWasherwoman", "devilLibrarian", "devilInvestigator", "devilChef",
            "devilEmpath", "devilFortuneTeller", "devilButler", "devilSpy", "devilTownsfolk",
          ]);
          f.phase = "intro_night";
          f.day = 1;

          t.assertDeepEqual(SH.stepIds(f), [
            "devil_intro_evil_info",
            "devil_intro_poisoner",
            "devil_intro_washerwoman",
            "devil_intro_librarian",
            "devil_intro_investigator",
            "devil_intro_chef",
            "devil_intro_empath",
            "devil_intro_fortune_teller",
            "devil_intro_butler",
            "devil_intro_spy",
          ], "intro night should use the official first-night order");
        },
      },
      {
        name: "Regular night follows Trouble Brewing other-night order",
        fn: function (t) {
          if (typeof getFlowSteps !== "function") return;
          var f = SH.setup("devil", [
            "devilPoisoner", "devilMonk", "devilScarletWoman", "devilImp", "devilRavenkeeper",
            "devilEmpath", "devilFortuneTeller", "devilUndertaker", "devilButler", "devilSpy", "devilTownsfolk",
          ]);
          f.phase = "night";
          f.day = 1;

          t.assertDeepEqual(SH.stepIds(f), [
            "devil_night_poisoner",
            "devil_night_monk",
            "devil_night_scarlet_woman",
            "devil_night_imp",
            "devil_night_ravenkeeper",
            "devil_night_empath",
            "devil_night_fortune_teller",
            "devil_night_undertaker",
            "devil_night_butler",
            "devil_night_spy",
          ], "regular night should use the official other-night order");
        },
      },
      {
        name: "First-night Poisoner affects Day 1 Clocktower abilities",
        fn: function (t) {
          if (typeof applyDevilDayActionsFromInputs !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilVirgin", "devilPoisoner", "devilTownsfolk", "devilTownsfolk"]);
          f.phase = "day";
          f.day = 1;
          f.draft.stepInputs = {
            devil_intro_poisoner: {
              fl_magician_disable: "1",
            },
            devil_day_actions: {
              fl_devil_virgin_first: true,
              fl_devil_virgin_nominator: "3",
            },
          };

          applyDevilDayActionsFromInputs(f);

          t.assert(appState.draw.players[3].alive !== false, "poisoned Virgin should not execute the nominator on Day 1");
          t.assert(f.draft.devilVirginUsed === true, "poisoned Virgin still spends the first nomination ability");
        },
      },
      {
        name: "Night: Imp kills target at dawn",
        fn: function (t) {
          if (typeof nextFlowStep !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilMonk", "devilTownsfolk", "devilTownsfolk"]);
          SH.atNight(f, 1, { mafiaShot: 3, doctorSave: null, magicianDisable: null });

          nextFlowStep();

          t.assert(f.phase === "day" && f.day === 2, "should advance to Day 2");
          t.assert(appState.draw.players[3].alive === false, "Imp target should die");
        },
      },
      {
        name: "Night: Monk protection blocks Imp kill",
        fn: function (t) {
          if (typeof nextFlowStep !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilMonk", "devilTownsfolk", "devilTownsfolk"]);
          SH.atNight(f, 1, { mafiaShot: 3, doctorSave: 3, magicianDisable: null });

          nextFlowStep();

          t.assert(appState.draw.players[3].alive !== false, "Monk-protected target should survive");
        },
      },
      {
        name: "Night: poisoned Monk cannot block the Imp",
        fn: function (t) {
          if (typeof nextFlowStep !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilMonk", "devilTownsfolk", "devilTownsfolk"]);
          SH.atNight(f, 1, { mafiaShot: 3, doctorSave: 3, magicianDisable: 2 });

          nextFlowStep();

          t.assert(appState.draw.players[3].alive === false, "target should die when Monk is poisoned");
        },
      },
      {
        name: "Night: Soldier survives Demon attack unless poisoned",
        fn: function (t) {
          if (typeof nextFlowStep !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilSoldier", "devilTownsfolk", "devilTownsfolk"]);
          SH.atNight(f, 1, { mafiaShot: 2, doctorSave: null, magicianDisable: null });
          nextFlowStep();
          t.assert(appState.draw.players[2].alive !== false, "unpoisoned Soldier should survive Demon attack");

          f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilSoldier", "devilTownsfolk", "devilTownsfolk"]);
          SH.atNight(f, 1, { mafiaShot: 2, doctorSave: null, magicianDisable: 2 });
          nextFlowStep();
          t.assert(appState.draw.players[2].alive === false, "poisoned Soldier should be killable");
        },
      },
      {
        name: "Night: Imp self-kill passes Demon to chosen Minion",
        fn: function (t) {
          if (typeof nextFlowStep !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilPoisoner", "devilTownsfolk", "devilTownsfolk", "devilTownsfolk"]);
          SH.atNight(f, 1, { mafiaShot: 0, doctorSave: null, magicianDisable: null, botcImpSuccessor: 1 });

          nextFlowStep();

          t.assert(appState.draw.players[0].alive === false, "original Imp should die");
          t.assert(appState.draw.players[1].roleId === "devilImp", "chosen Minion should become the new Imp");
          t.assert(f.phase === "day" && f.day === 2, "game should continue with the new Imp alive");
        },
      },
      {
        name: "Day execution: Scarlet Woman catches an executed Imp at five alive",
        fn: function (t) {
          if (typeof applyDayElimFromPayload !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilScarletWoman", "devilTownsfolk", "devilTownsfolk", "devilTownsfolk"]);
          f.phase = "day";
          f.day = 1;

          applyDayElimFromPayload(f, { out: 0 });

          t.assert(appState.draw.players[0].alive === false, "executed Imp should die");
          t.assert(appState.draw.players[1].roleId === "devilImp", "Scarlet Woman should become Imp");
        },
      },
      {
        name: "Day execution: executing Saint gives evil the win",
        fn: function (t) {
          if (typeof applyDayElimFromPayload !== "function" || typeof checkAndAutoNavigate !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilSaint", "devilTownsfolk", "devilTownsfolk", "devilTownsfolk"]);
          f.phase = "day";
          f.day = 1;

          applyDayElimFromPayload(f, { out: 1 });
          checkAndAutoNavigate(f, "day", 1, 2);

          t.assert(f.phase === "winner", "Saint execution should end the game");
          t.assert(f.draft.winnerTeam === "mafia", "evil should win when Saint is executed");
        },
      },
      {
        name: "Day execution: killing the only Imp gives good the win",
        fn: function (t) {
          if (typeof applyDayElimFromPayload !== "function" || typeof checkAndAutoNavigate !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilTownsfolk", "devilTownsfolk", "devilTownsfolk"]);
          f.phase = "day";
          f.day = 1;

          applyDayElimFromPayload(f, { out: 0 });
          checkAndAutoNavigate(f, "day", 1, 2);

          t.assert(f.phase === "winner", "dead final Demon should end the game");
          t.assert(f.draft.winnerTeam === "citizens", "good should win when no Demon is alive");
        },
      },
      {
        name: "Mayor: three alive and no execution gives good the win",
        fn: function (t) {
          if (typeof applyDayElimFromPayload !== "function" || typeof checkAndAutoNavigate !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilMayor", "devilTownsfolk"]);
          f.phase = "day";
          f.day = 3;

          applyDayElimFromPayload(f, { out: null, noExecution: true });
          checkAndAutoNavigate(f, "day", 3, 2);

          t.assert(f.phase === "winner", "Mayor no-execution final three should end the game");
          t.assert(f.draft.winnerTeam === "citizens", "good should win by Mayor condition");
        },
      },
      {
        name: "Slayer: day shot kills the Imp and can trigger good win",
        fn: function (t) {
          if (typeof applyDevilDayActionsFromInputs !== "function" || typeof checkAndAutoNavigate !== "function") return;
          var f = SH.setup("devil", ["devilImp", "devilSlayer", "devilTownsfolk", "devilTownsfolk"]);
          f.phase = "day";
          f.day = 1;
          f.draft.stepInputs = {
            devil_day_actions: {
              fl_devil_slayer_fire: true,
              fl_devil_slayer_target: "0",
            },
          };

          applyDevilDayActionsFromInputs(f);
          checkAndAutoNavigate(f, "day", 1, 0);

          t.assert(appState.draw.players[0].alive === false, "Slayer should kill the Imp");
          t.assert(f.phase === "winner" && f.draft.winnerTeam === "citizens", "good should win after final Demon dies");
        },
      },
    ],
  };

  window.DEVIL_TESTS = suite;
})();

/**
 * Tests that ALL flow actions can be reverted when going back to previous steps.
 *
 * Project rule: "Full back/forth: God must be able to go Next and Previous for every Phase.
 * Record everything so they can be replayed and reverted correctly."
 *
 * Covers: night_resolution, day_elim, namayande_vote, kabo_shoot, bazras_forced_vote,
 * day_gun_expiry, day_guns, day_kane_reveal, day_end_card_action.
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupDraw(scenarioId) {
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
        { roleId: "nostradamus", alive: true },
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
        { roleId: "herbalist", alive: true },
        { roleId: "armorsmith", alive: true },
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
      players: setupDraw(scenarioId),
      uiAtDraw: { scenario: scenarioId },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  const suite = {
    name: "revert-flow-actions",
    tests: [
      {
        name: "night_resolution: mafia shot victim alive when going back from Day 2 to Night 1",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupScenario("classic");
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
          if (f.phase !== "day" || f.day !== 2) return;
          assert(draw[victimIdx].alive === false, "victim should be dead after night resolution");

          prevFlowStep();
          assert(draw[victimIdx].alive !== false, "victim should be alive after going back");
        },
      },
      {
        name: "day_elim: voted-out person alive when going back to day_vote (same day)",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof applyEffect !== "function" || typeof hasEffect !== "function") return;
          const f = setupScenario("classic");
          const draw = appState.draw.players;
          const victimIdx = 3;
          if (!draw[victimIdx]) return;

          f.phase = "day";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["2"] = ["day_dawn_resolution", "day_vote", "day_elim"];
          f.step = 2; // day_elim (step 0=dawn, 1=day_vote, 2=day_elim)
          f.draft.voteCandidatesByDay = f.draft.voteCandidatesByDay || {};
          f.draft.voteCandidatesByDay["2"] = [victimIdx];
          f.draft.elimCandidatesByDay = f.draft.elimCandidatesByDay || {};
          f.draft.elimCandidatesByDay["2"] = [victimIdx];

          const applied = hasEffect("day_elim")
            ? applyEffect("day_elim", { f, payload: { out: victimIdx } })
            : (typeof applyDayElimFromPayload === "function" && applyDayElimFromPayload(f, { out: victimIdx }));
          if (!applied) return;
          assert(draw[victimIdx].alive === false, "victim should be dead after vote-out");

          prevFlowStep();
          assert(draw[victimIdx].alive !== false, "victim should be alive when back on day_vote");
        },
      },
      {
        name: "day_end_card_action (Beautiful Mind): voted-out alive after reverting end card then day_elim",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof applyDayElimFromPayload !== "function") return;
          const votedOutIdx = 1;
          const nostradamusIdx = 3;
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
          appState.draw.players[votedOutIdx].alive = false;
          appState.god = appState.god || {};
          appState.god.flow = null;
          appState.god.endCards = { byDay: { "1": { out: votedOutIdx, cardId: "beautiful_mind", at: Date.now() } }, used: ["beautiful_mind"] };
          const f = ensureFlow();
          if (!f.draft) f.draft = {};
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["1"] = { out: votedOutIdx, prevAlive: true };
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["day_vote", "day_elim", "day_end_card_pick", "day_end_card_beautiful_mind"];
          f.phase = "day";
          f.day = 1;
          f.step = 3; // on day_end_card_beautiful_mind (pick is at 2, action at 3)
          f.draft.endCardActionByDay = f.draft.endCardActionByDay || {};
          f.draft.endCardActionByDay["1"] = { target: nostradamusIdx };
          f.draft.endCardActionAppliedByDay = f.draft.endCardActionAppliedByDay || {};
          f.draft.endCardActionAppliedByDay["1"] = {
            cardId: "beautiful_mind",
            out: votedOutIdx,
            target: nostradamusIdx,
            prevState: {
              outAlive: false,
              tgtAlive: true,
              dayElimOut: votedOutIdx,
              dayElimPrevAlive: true,
              dayElimChainOut: null,
              dayElimChainPrevAlive: null,
              dayElimArmoredAbsorbed: false,
            },
          };
          appState.draw.players[votedOutIdx].alive = true;
          appState.draw.players[nostradamusIdx].alive = false;
          f.draft.dayElimAppliedByDay["1"] = { out: nostradamusIdx, prevAlive: true };

          const draw = appState.draw.players;
          assert(draw[votedOutIdx].alive === true, "voted-out should be alive after Beautiful Mind");
          assert(draw[nostradamusIdx].alive === false, "Nostradamus should be dead");

          prevFlowStep(); // BM action → pick step (BM reverted)
          assert(draw[votedOutIdx].alive === false, "voted-out should be dead after reverting Beautiful Mind");
          assert(draw[nostradamusIdx].alive === true, "Nostradamus should be alive");

          prevFlowStep(); // pick step → day_elim (no game state change)
          prevFlowStep(); // day_elim → day_vote (elim reverted)
          assert(draw[votedOutIdx].alive === true, "voted-out should be alive again after reverting day_elim");
        },
      },
      {
        name: "day_end_card: no duplicate step when snapshot has wrong card (go back, change votes, new card drawn)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
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
          appState.god.flow = null;
          appState.god.endCards = { byDay: { "1": { out: 1, cardId: "handcuffs", at: Date.now() } }, used: ["handcuffs"] };
          const f = ensureFlow();
          if (!f.draft) f.draft = {};
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["day_vote", "day_elim", "day_end_card_beautiful_mind"];
          f.phase = "day";
          f.day = 1;

          const steps = getFlowSteps(f);
          const endCardSteps = steps.filter((s) => s && s.id && String(s.id).startsWith("day_end_card_"));
          assert(endCardSteps.length === 1, "Should have exactly one end card step");
          assert(endCardSteps[0].id === "day_end_card_handcuffs", "Should show handcuffs (current card), not beautiful_mind from snapshot");
        },
      },
      {
        name: "night_revert Armorsmith: armorsmithSelfUsed false when going back from Day 2 to Night 1",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupScenario("kabo");
          const draw = appState.draw.players;
          const armorsmithIdx = draw.findIndex((p) => p && p.roleId === "armorsmith");
          if (armorsmithIdx < 0) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: 5, armorsmithArmor: armorsmithIdx };
          f.draft.armorsmithSelfUsed = true;
          f.draft.armorsmithSelfUsedOnNight = 1;
          addFlowEvent("night_actions", { mafiaShot: 5, armorsmithArmor: armorsmithIdx });

          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;
          assert(f.draft.armorsmithSelfUsed === true, "armorsmithSelfUsed should be true after night resolution");

          prevFlowStep();
          assert(f.draft.armorsmithSelfUsed !== true, "armorsmithSelfUsed must be reverted when going back to Night 1 so Armorsmith can choose himself again");
        },
      },
      {
        name: "night_revert Herbalist: poison victim alive and herbalistCycleComplete false when going back",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupScenario("kabo");
          const draw = appState.draw.players;
          const victimIdx = 5;
          if (!draw[victimIdx]) return;

          // Kabo poison: Herbalist poisons Night 1; victim stays alive until Night 2 resolution.
          // At dawn of Day 3 (Night 2 resolution): if no antidote → victim dies.
          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: null, herbalistPoison: victimIdx };
          addFlowEvent("night_actions", { mafiaShot: null, herbalistPoison: victimIdx });

          nextFlowStep(); // Night 1 -> Day 2 (poison does NOT kill yet; victim stays alive)
          if (f.phase !== "day" || f.day !== 2) return;
          assert(draw[victimIdx].alive !== false, "herbalist poison victim stays alive after Night 1 resolution (kills at Night 2)");

          prevFlowStep(); // Day 2 -> Night 1
          assert(draw[victimIdx].alive !== false, "herbalist poison victim still alive after revert (was never killed)");
          assert(f.draft.herbalistCycleComplete !== true, "herbalistCycleComplete not set at Night 1 (poison deferred)");
        },
      },
      {
        name: "night_revert Doctor: doctor save reverted when going back from Day 2 to Night 1",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupScenario("classic");
          const draw = appState.draw.players;
          const victimIdx = 3;
          const doctorIdx = 1;
          if (!draw[victimIdx] || !draw[doctorIdx]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: victimIdx, doctorSave: victimIdx };
          addFlowEvent("night_actions", { mafiaShot: victimIdx, doctorSave: victimIdx });

          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;
          assert(draw[victimIdx].alive !== false, "doctor save: victim should be alive after night");

          prevFlowStep();
          assert(draw[victimIdx].alive !== false, "victim should still be alive after revert (mafia kill was reverted)");
        },
      },
      {
        name: "night_resolution: Kane ability consumed reverted when going back from Day 2 to Night 1",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          appState.ui.scenario = "pedarkhande";
          appState.draw = {
            players: [
              { roleId: "godfather", alive: true },
              { roleId: "matador", alive: true },
              { roleId: "watson", alive: true },
              { roleId: "leon", alive: true },
              { roleId: "citizenKane", alive: true },
              { roleId: "constantine", alive: true },
              { roleId: "nostradamus", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "pedarkhande" },
          };
          appState.god = appState.god || {};
          appState.god.flow = null;
          const f = ensureFlow();
          const draw = appState.draw.players;
          const citizenIdx = 7;
          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            doctorSave: null,
            professionalShot: null,
            kaneMark: citizenIdx,
            constantineRevive: null,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            matadorDisable: null,
            doctorSave: null,
            professionalShot: null,
            kaneMark: citizenIdx,
            constantineRevive: null,
          });
          nextFlowStep();
          assert(f.draft.kaneAbilityUsed === true, "Kane ability should be consumed when marked player survives");
          if (f.phase !== "day" || f.day !== 2) return;
          prevFlowStep();
          assert(f.draft.kaneAbilityUsed !== true, "Kane ability should be reverted when going back to Night 1");
        },
      },
      {
        name: "effect-registry: all revertible steps have revert handlers",
        fn: function ({ assert }) {
          if (typeof hasEffect !== "function") return;
          const REVERTIBLE = [
            "night_resolution",
            "day_elim",
            "namayande_vote",
            "kabo_shoot",
            "bazras_forced_vote",
            "day_gun_expiry",
            "day_guns",
            "day_kane_reveal",
            "day_end_card_action",
          ];
          for (const stepId of REVERTIBLE) {
            assert(hasEffect(stepId), stepId + " should be registered in effect registry");
            const h = window.EFFECT_REGISTRY && window.EFFECT_REGISTRY[stepId];
            assert(h && h.revert, stepId + " should have revert handler");
          }
        },
      },
    ],
  };

  window.REVERT_FLOW_ACTIONS_TESTS = suite;
})();

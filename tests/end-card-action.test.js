/**
 * Tests that when a player draws an end card with an action, the End Card action page
 * is shown in the flow (day_end_card_* step) right after the elimination.
 *
 * Bug: Beautiful Mind (and other action cards) were not showing the action page because
 * getEndCardActionStepForDay required day_elim_out event, which is only added when the
 * user clicks Next — but the steps array is built before that, so the end card step
 * was never included.
 *
 * Run from tests/run.html (loads flow-engine, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  const END_CARD_ACTION_IDS = ["face_change", "handcuffs", "beautiful_mind", "silence_lambs"];

  function setupPedarkhandeWithElimAndCard(outIdx, cardId) {
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
    appState.draw.players[outIdx].alive = false;
    appState.god = appState.god || {};
    appState.god.flow = {
      phase: "day",
      day: 1,
      step: 0,
      events: [],
      draft: {},
    };
    appState.god.endCards = {
      byDay: { "1": { out: outIdx, cardId, at: Date.now() } },
      used: [cardId],
    };
    return ensureFlow();
  }

  const suite = {
    name: "end-card-action",
    tests: [
      ...END_CARD_ACTION_IDS.map((cardId) => ({
        name: "End card " + cardId + " shows action step when drawn (before day_elim_out)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const outIdx = 1;
          const f = setupPedarkhandeWithElimAndCard(outIdx, cardId);
          const steps = getFlowSteps(f);
          const endCardStepId = "day_end_card_" + cardId;
          const hasStep = steps.some((s) => s && s.id === endCardStepId);
          assert(hasStep, "getFlowSteps should include " + endCardStepId + " when card is drawn, got: " + steps.map((s) => s?.id).join(", "));
        },
      })),
      {
        name: "Beautiful Mind: action step shows when Nostradamus draws it (self-pick allowed)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const nostradamusIdx = 3;
          const f = setupPedarkhandeWithElimAndCard(nostradamusIdx, "beautiful_mind");
          const steps = getFlowSteps(f);
          const hasStep = steps.some((s) => s && s.id === "day_end_card_beautiful_mind");
          // Nostradamus can self-pick (shield destroyed but survives), so action page always shows.
          assert(hasStep, "Beautiful Mind should show action step even when Nostradamus draws it");
        },
      },
      {
        name: "End card step appears in flow after day_elim when card has action",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupPedarkhandeWithElimAndCard(1, "handcuffs");
          const steps = getFlowSteps(f);
          const elimIdx = steps.findIndex((s) => s && s.id === "day_elim");
          const endCardIdx = steps.findIndex((s) => s && s.id === "day_end_card_handcuffs");
          assert(elimIdx >= 0, "day_elim should be in steps");
          assert(endCardIdx >= 0, "day_end_card_handcuffs should be in steps");
          assert(endCardIdx > elimIdx, "End card action step should come after day_elim");
        },
      },
      {
        name: "Beautiful Mind revert: voted-out comes back to life when going back to day_vote",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof applyDayElimFromPayload !== "function") return;
          const votedOutIdx = 1;
          const nostradamusIdx = 3;
          const f = setupPedarkhandeWithElimAndCard(votedOutIdx, "beautiful_mind");
          if (!f.draft) f.draft = {};
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["1"] = { out: votedOutIdx, prevAlive: true };
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["day_vote", "day_elim", "day_end_card_pick", "day_end_card_beautiful_mind"];
          f.step = 3; // on day_end_card_beautiful_mind (pick is at 2, action at 3)
          if (!f.draft.endCardActionByDay) f.draft.endCardActionByDay = {};
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
        name: "No duplicate end card step when using snapshot (back from night)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupPedarkhandeWithElimAndCard(1, "beautiful_mind");
          const stepIds = ["day_kane_reveal", "day_vote", "day_elim", "day_end_card_beautiful_mind"];
          if (!f.draft) f.draft = {};
          if (!f.draft.dayStepsByDay) f.draft.dayStepsByDay = {};
          f.draft.dayStepsByDay["1"] = stepIds;
          const steps = getFlowSteps(f);
          const endCardSteps = steps.filter((s) => s && s.id && String(s.id).startsWith("day_end_card_"));
          assert(endCardSteps.length === 1, "Should have exactly one end card step, got: " + endCardSteps.length + " — " + steps.map((s) => s?.id).join(", "));
        },
      },
      {
        name: "Snapshot with wrong card replaced by actual drawn card (no duplicate)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupPedarkhandeWithElimAndCard(1, "handcuffs");
          const stepIds = ["day_kane_reveal", "day_vote", "day_elim", "day_end_card_beautiful_mind"];
          if (!f.draft) f.draft = {};
          if (!f.draft.dayStepsByDay) f.draft.dayStepsByDay = {};
          f.draft.dayStepsByDay["1"] = stepIds;
          const steps = getFlowSteps(f);
          const endCardSteps = steps.filter((s) => s && s.id && String(s.id).startsWith("day_end_card_"));
          assert(endCardSteps.length === 1, "Should have exactly one end card step");
          assert(endCardSteps[0].id === "day_end_card_handcuffs", "Should show handcuffs (drawn card), not beautiful_mind from snapshot");
        },
      },
      // Instruction 140/150: End-card-action page matches drawn card
      {
        name: "End card action step matches drawn card (instruction 140)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          for (const cardId of END_CARD_ACTION_IDS) {
            const f = setupPedarkhandeWithElimAndCard(1, cardId);
            const steps = getFlowSteps(f);
            const stepId = "day_end_card_" + cardId;
            const hasStep = steps.some((s) => s && s.id === stepId);
            assert(hasStep, "Drawn card " + cardId + " should show matching end card step " + stepId);
          }
        },
      },
      // Instruction 160: All end-card-action pages work
      {
        name: "All end card action steps render (instruction 160)",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          for (const cardId of END_CARD_ACTION_IDS) {
            const f = setupPedarkhandeWithElimAndCard(1, cardId);
            f.draft = f.draft || {};
            f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
            f.draft.dayStepsByDay["1"] = ["day_vote", "day_elim", "day_end_card_" + cardId];
            f.step = 2;
            showFlowTool();
            const html = window._lastFlowModalHtml || "";
            assert(html.length > 50, "End card " + cardId + " should render action page");
          }
        },
      },
      {
        name: "Face Off swaps roles: voted-out and chosen target exchange roles",
        fn: function ({ assert }) {
          if (typeof applyEndCardActionForDay !== "function") return;
          const outIdx = 1;
          const targetIdx = 2;
          const f = setupPedarkhandeWithElimAndCard(outIdx, "face_change");
          const draw = appState.draw.players;
          const origOutRole = draw[outIdx].roleId || "citizen";
          const origTgtRole = draw[targetIdx].roleId || "citizen";
          if (!f.draft) f.draft = {};
          f.draft.endCardActionByDay = f.draft.endCardActionByDay || {};
          f.draft.endCardActionByDay["1"] = { target: targetIdx };
          applyEndCardActionForDay(f);
          assert(draw[outIdx].roleId === origTgtRole, "Voted-out player should have target's role after Face Off swap");
          assert(draw[targetIdx].roleId === origOutRole, "Chosen target should have voted-out's role after Face Off swap");
        },
      },
      {
        name: "Status Check shows Changed Roles when Face Off is applied",
        fn: function ({ assert }) {
          if (typeof getChangedRolesForStatusCheck !== "function") return;
          const outIdx = 1;
          const targetIdx = 2;
          const f = setupPedarkhandeWithElimAndCard(outIdx, "face_change");
          if (!f.draft) f.draft = {};
          f.draft.endCardActionByDay = f.draft.endCardActionByDay || {};
          f.draft.endCardActionByDay["1"] = { target: targetIdx };
          f.draft.endCardActionAppliedByDay = f.draft.endCardActionAppliedByDay || {};
          f.draft.endCardActionAppliedByDay["1"] = {
            cardId: "face_change",
            out: outIdx,
            target: targetIdx,
            prevState: { outRole: "detective", tgtRole: "doctor" },
          };
          const changed = getChangedRolesForStatusCheck(f, 1, "day");
          assert(changed.length === 1, "Status Check should return one Face Off pair");
          assert(changed[0].out === outIdx && changed[0].target === targetIdx, "Changed Roles should show voted-out and target pair");
        },
      },
    ],
  };

  window.END_CARD_ACTION_TESTS = suite;
})();

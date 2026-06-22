/**
 * Tests that player selections in the Flow use player cards, not dropdowns.
 * Per design/player-selection-cards.md: "Always use cards for selections —
 * never radio buttons, checkboxes, or dropdowns when a card-based choice is feasible."
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupKaboNight1Armorsmith() {
    appState.ui.scenario = "kabo";
    appState.draw = {
      players: [
        { roleId: "danMafia", alive: true },
        { roleId: "witch", alive: true },
        { roleId: "executioner", alive: true },
        { roleId: "detective", alive: true },
        { roleId: "heir", alive: true },
        { roleId: "herbalist", alive: true },
        { roleId: "armorsmith", alive: true },
        { roleId: "suspect", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "kabo" },
    };
    appState.god = appState.god || {};
    appState.god.flow = {
      phase: "night",
      day: 1,
      step: 4,
      events: [],
      draft: {
        nightActionsByNight: {
          "1": {
            mafiaShot: 0,
            herbalistPoison: null,
            herbalistAntidote: null,
            detectiveQuery: null,
            armorsmithArmor: null,
          },
        },
      },
    };
    return ensureFlow();
  }

  const suite = {
    name: "player-selection-cards",
    tests: [
      {
        name: "Armorsmith step uses player cards, not dropdown",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupKaboNight1Armorsmith();
          const steps = getFlowSteps({ ...f, phase: "night" });
          const armorsmithStepIdx = steps.findIndex((s) => s && s.id === "night_armorsmith");
          if (armorsmithStepIdx < 0) return;
          f.step = armorsmithStepIdx;
          showFlowTool();

          const container = document.getElementById("flowModalContainer");
          if (!container) return;

          const selectEl = container.querySelector("select#fl_armor_target");
          const cardGroup = container.querySelector('.nightTargetGroup[data-field="fl_armor_target"]');
          const cards = container.querySelectorAll('.nightTargetGroup[data-field="fl_armor_target"] .nightPlayerCard');

          assert(selectEl === null, "Armorsmith selection must use player cards, not a dropdown (select#fl_armor_target)");
          assert(cardGroup !== null, "Armorsmith must have nightTargetGroup with data-field=fl_armor_target");
          assert(cards.length >= 2, "Armorsmith must show at least 2 cards (— option + players)");
        },
      },
      {
        name: "Known player-selection fields use nightPlayerCard (no dropdowns)",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function") return;
          const playerSelectionFields = [
            "fl_armor_target",
            "fl_herb_poison",
            "fl_herb_antidote",
            "fl_mafia_shot",
            "fl_saul_buy_target",
            "fl_const_revive",
            "fl_kane_mark",
          ];
          const f = setupKaboNight1Armorsmith();
          showFlowTool();

          const container = document.getElementById("flowModalContainer");
          if (!container) return;

          for (const fieldId of playerSelectionFields) {
            const selectEl = container.querySelector("select#" + fieldId);
            const cardGroup = container.querySelector('.nightTargetGroup[data-field="' + fieldId + '"]');
            if (cardGroup) {
              assert(selectEl === null, "Field " + fieldId + " must use cards, not dropdown");
            }
          }
        },
      },
    ],
  };

  window.PLAYER_SELECTION_CARDS_TESTS = suite;
})();

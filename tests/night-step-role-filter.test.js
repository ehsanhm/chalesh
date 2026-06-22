/**
 * Tests that night steps for roles not in the game are skipped.
 * E.g. when Kabo has no Kadkhoda in the draw, the Kadkhoda night step must not appear.
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupKaboWithoutKadkhoda() {
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
    appState.god.flow = null;
    return ensureFlow();
  }

  function setupKaboWithKadkhoda() {
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
        { roleId: "kadkhoda", alive: true },
        { roleId: "citizen", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "kabo" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  const suite = {
    name: "night-step-role-filter",
    tests: [
      {
        name: "Kabo without Kadkhoda: night_kadkhoda step is not shown",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupKaboWithoutKadkhoda();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const kadkhodaStep = steps.find((s) => s && s.id === "night_kadkhoda");
          assert(kadkhodaStep === undefined, "night_kadkhoda step must not appear when Kadkhoda is not in the game");
          assert(steps.length === 5, "Kabo night without Kadkhoda should have 5 steps (heir, mafia, herbalist, detective, armorsmith), got " + steps.length);
        },
      },
      {
        name: "Kabo with Kadkhoda: night_kadkhoda step is shown",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupKaboWithKadkhoda();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const kadkhodaStep = steps.find((s) => s && s.id === "night_kadkhoda");
          assert(kadkhodaStep !== undefined, "night_kadkhoda step must appear when Kadkhoda is in the game");
          assert(steps.length === 6, "Kabo night with Kadkhoda should have 6 steps, got " + steps.length);
        },
      },
      {
        name: "Classic without Doctor: night_doctor step is not shown",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          appState.ui.scenario = "classic";
          appState.draw = {
            players: [
              { roleId: "mafiaBoss", alive: true },
              { roleId: "detective", alive: true },
              { roleId: "citizen", alive: true },
              { roleId: "citizen", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "classic" },
          };
          appState.god = appState.god || {};
          appState.god.flow = null;
          const f = ensureFlow();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const doctorStep = steps.find((s) => s && s.id === "night_doctor");
          assert(doctorStep === undefined, "night_doctor step must not appear when Doctor is not in the game");
        },
      },
      {
        name: "Classic with Doctor: night_doctor step is shown",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          appState.ui.scenario = "classic";
          appState.draw = {
            players: [
              { roleId: "mafiaBoss", alive: true },
              { roleId: "detective", alive: true },
              { roleId: "doctor", alive: true },
              { roleId: "citizen", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "classic" },
          };
          appState.god = appState.god || {};
          appState.god.flow = null;
          const f = ensureFlow();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const doctorStep = steps.find((s) => s && s.id === "night_doctor");
          assert(doctorStep !== undefined, "night_doctor step must appear when Doctor is in the game");
        },
      },
      {
        name: "Classic without Mafia Boss (simple mafia only): night_mafia step is still in flow",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          appState.ui.scenario = "classic";
          appState.draw = {
            players: [
              { roleId: "mafia", alive: true },
              { roleId: "mafia", alive: true },
              { roleId: "mafia", alive: true },
              { roleId: "detective", alive: true },
              { roleId: "doctor", alive: true },
            ],
            uiAtDraw: { scenario: "classic" },
          };
          appState.god = appState.god || {};
          appState.god.flow = null;
          const f = ensureFlow();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const mafiaStep = steps.find((s) => s && s.id === "night_mafia");
          assert(mafiaStep !== undefined, "night_mafia step must appear when simple mafia (no boss) are in the game");
        },
      },
      {
        name: "Kabo without Armorsmith: night_armorsmith step is not shown",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          appState.ui.scenario = "kabo";
          appState.draw = {
            players: [
              { roleId: "danMafia", alive: true },
              { roleId: "witch", alive: true },
              { roleId: "executioner", alive: true },
              { roleId: "detective", alive: true },
              { roleId: "heir", alive: true },
              { roleId: "herbalist", alive: true },
              { roleId: "kadkhoda", alive: true },
              { roleId: "suspect", alive: true },
              { roleId: "citizen", alive: true },
              { roleId: "citizen", alive: true },
            ],
            uiAtDraw: { scenario: "kabo" },
          };
          appState.god = appState.god || {};
          appState.god.flow = null;
          const f = ensureFlow();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const armorsmithStep = steps.find((s) => s && s.id === "night_armorsmith");
          assert(armorsmithStep === undefined, "night_armorsmith step must not appear when Armorsmith is not in the game");
        },
      },
      {
        name: "Step title matches content: Herbalist step shows Herbalist (not Mafia)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupKaboWithoutKadkhoda();
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const herbalistStep = steps.find((s) => s && s.id === "night_herbalist");
          assert(herbalistStep != null, "Must have night_herbalist step");
          const titleLower = String(herbalistStep.title || "").toLowerCase();
          assert(titleLower.includes("herbalist") || titleLower.includes("عطار"), "Herbalist step title must identify Herbalist for content to match, got: " + herbalistStep.title);
        },
      },
    ],
  };

  window.NIGHT_STEP_ROLE_FILTER_TESTS = suite;
})();

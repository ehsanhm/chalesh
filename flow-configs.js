/**
 * Flow configs — phases and sub-steps per scenario.
 * Loads per-scenario files from flow-configs/*.js, then provides getFlowConfig().
 *
 * IMPORTANT: The step order in these configs defines the order events happen in the game.
 * Status Check must save and display data in this same order. See design/00-night-phases-and-status-check.md.
 *
 * Structure per scenario:
 *   intro_day: [step ids]
 *   intro_night: [step ids]
 *   day: { base: [...], steps?: [...], endCards?: bool, kaneReveal?: bool }
 *     - base: legacy step ids
 *     - steps: explicit array, e.g. ["day_kane_reveal?", "day_vote", "day_elim", "end_card_action?"]
 *       (? = conditional: day_kane_reveal only when Kane marked mafia; end_card_action only when applicable)
 *   night: [explicit step ids] — one per wake order entry, same order as scenarios.js wakeOrder
 *
 * To add a new scenario: create flow-configs/<scenario_id>.js
 */
(function () {
  "use strict";
  window.FLOW_CONFIGS = window.FLOW_CONFIGS || {};
  window.getFlowConfig = function (scenarioId) {
    const cfg = window.FLOW_CONFIGS[scenarioId];
    if (cfg) return cfg;
    // Case-insensitive fallback for camelCase scenario IDs (e.g. "classicpro" → "classicPro")
    const lower = String(scenarioId || "").toLowerCase();
    for (const k of Object.keys(window.FLOW_CONFIGS)) {
      if (k.toLowerCase() === lower) return window.FLOW_CONFIGS[k];
    }
    return window.FLOW_CONFIGS.classic || {
      intro_day: ["intro_day_run"],
      intro_night: ["intro_night_run"],
      day: { steps: ["day_vote", "day_elim"] },
      night: ["night_mafia", "night_doctor", "night_detective"],
    };
  };
})();

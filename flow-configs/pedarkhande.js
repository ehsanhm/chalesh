/** Pedarkhande (Godfather) — flow phases and sub-steps
 * Reference config: explicit steps, optional (?), end cards.
 * Intro night: Nostradamus → choose side → mafia → wake order.
 * Day: day_kane_reveal? → vote → elim → end_card_action?
 * Night: explicit role steps (mafia, Watson, Leon, Kane, Constantine).
 */
(function () {
  "use strict";
  (window.FLOW_CONFIGS = window.FLOW_CONFIGS || {}).pedarkhande = {
    intro_day: ["intro_day_run"],
    intro_night: [
      "intro_night_nostradamus",
      "nostradamus_choose_side",
      "intro_night_mafia",
      "intro_night_wake_order",
    ],
    day: {
      steps: [
        "day_kane_reveal?",
        "day_vote",
        "day_elim",
        "end_card_action?",
      ],
    },
    night: [
      "night_nostradamus", // intro only, filtered on Night 1+
      "night_mafia_team",
      "night_watson",
      "night_leon",
      "night_kane",
      "night_constantine",
    ],
  };
})();

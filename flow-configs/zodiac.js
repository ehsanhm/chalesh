/** Zodiac scenario — flow phases and sub-steps
 * Rules: tgmafia.com/scenario-zodiac
 * Intro night: standard wake order.
 * Day: day_guns? → day_gun_expiry? → day_vote → day_elim.
 *   (? = conditional: guns/bomb step only when applicable; gun expiry only when unfired real guns exist)
 * Night: explicit steps (Zodiac filtered on odd nights by engine).
 */
(function () {
  "use strict";
  (window.FLOW_CONFIGS = window.FLOW_CONFIGS || {}).zodiac = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: {
      steps: [
        "day_guns?",
        "day_gun_expiry?",
        "day_vote",
        "day_elim",
      ],
    },
    night: [
      "night_mafia",
      "night_magician",
      "night_bomber",
      "night_professional",
      "night_doctor",
      "night_detective",
      "night_gunslinger",
      "night_ocean",
      "night_zodiac",
    ],
  };
})();

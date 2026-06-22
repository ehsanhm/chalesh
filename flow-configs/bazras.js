/** Bazras (Inspector) scenario — flow phases and sub-steps
 * Inspector picks 2 players at night; if both survive, next day: interrogation → mid-day (Cancel/Continue) → forced vote → day_vote → day_elim.
 * Flow engine builds steps dynamically from interrogation + base.
 */
(function () {
  "use strict";
  (window.FLOW_CONFIGS = window.FLOW_CONFIGS || {}).bazras = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: {
      base: ["day_vote", "day_elim"],
      interrogation: ["bazras_interrogation", "bazras_midday", "bazras_forced_vote"],
      endCards: false,
    },
    night: [
      "night_researcher",
      "night_mafia",
      "night_swindler",
      "night_doctor",
      "night_sniper",
      "night_detective",
      "night_inspector",
    ],
  };
})();

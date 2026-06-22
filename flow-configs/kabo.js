/** Kabo (Capo) scenario — flow phases and sub-steps
 * Day 1: trust vote → suspect select → mid-day sleep (Capo sets real bullet) → defense & shoot.
 * Day 2+: day_vote → day_elim. Flow engine uses day1 when trust vote passed.
 */
(function () {
  "use strict";
  (window.FLOW_CONFIGS = window.FLOW_CONFIGS || {}).kabo = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: {
      day1: ["kabo_trust_vote", "kabo_suspect_select", "kabo_midday", "kabo_shoot"],
      default: ["day_vote", "day_elim"],
      endCards: false,
    },
    night: [
      "night_heir",
      "night_herbalist",
      "night_mafia",
      "night_detective",
      "night_armorsmith",
      "night_kadkhoda",
    ],
  };
})();

/** Namayande (Representative) scenario — flow phases and sub-steps
 * Day 1: rep election. Day 2+: rep action → cover → defense → vote.
 * Flow engine uses day1 for first day only.
 */
(function () {
  "use strict";
  (window.FLOW_CONFIGS = window.FLOW_CONFIGS || {}).namayande = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: {
      day1: ["namayande_rep_election"],
      default: [
        "namayande_rep_action",
        "namayande_cover",
        "namayande_defense",
        "namayande_vote",
      ],
      endCards: false,
    },
    night: [
      "night_hacker",
      "night_mafia",
      "night_guide",
      "night_doctor",
      "night_bodyguard",
      "night_soldier",
      "night_minemaker",
      "night_lawyer",
    ],
  };
})();

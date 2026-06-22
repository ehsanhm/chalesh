/** Classic scenario — flow phases and sub-steps
 * Standard mafia: mafia, doctor, detective. Day = vote → elim.
 */
(function () {
  "use strict";
  (window.FLOW_CONFIGS = window.FLOW_CONFIGS || {}).classic = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: {
      steps: ["day_vote", "day_elim"],
      endCards: false,
    },
    night: ["night_mafia", "night_doctor", "night_detective"],
  };
})();

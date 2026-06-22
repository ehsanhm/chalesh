/**
 * Devil scenario - Blood on the Clocktower Trouble Brewing inspired flow.
 *
 * Intro night follows the Trouble Brewing first-night sheet: evil info,
 * Poisoner, setup information, ongoing information, Butler, then Spy.
 * Regular nights resolve Poisoner -> Monk -> Scarlet Woman check -> Imp
 * -> information roles.
 */
(function () {
  "use strict";
  const FLOW = window.FLOW_CONFIGS || {};
  window.FLOW_CONFIGS = FLOW;

  FLOW.devil = {
    intro_day: ["intro_day_run"],
    intro_night: [
      "devil_intro_evil_info",
      "devil_intro_poisoner",
      "devil_intro_washerwoman",
      "devil_intro_librarian",
      "devil_intro_investigator",
      "devil_intro_chef",
      "devil_intro_empath",
      "devil_intro_fortune_teller",
      "devil_intro_butler",
      "devil_intro_spy",
    ],
    day: { steps: ["devil_day_actions", "day_vote", "day_elim"] },
    night: [
      "devil_night_poisoner",
      "devil_night_monk",
      "devil_night_scarlet_woman",
      "devil_night_imp",
      "devil_night_ravenkeeper",
      "devil_night_empath",
      "devil_night_fortune_teller",
      "devil_night_undertaker",
      "devil_night_butler",
      "devil_night_spy",
    ],
  };
})();

/**
 * Standard flow — mozaker, takavar, meeting_epic, classicPro, shab_mafia.
 * day_vote → day_elim, no end cards. Each scenario has explicit night steps.
 */
(function () {
  "use strict";
  const FLOW = window.FLOW_CONFIGS || {};
  window.FLOW_CONFIGS = FLOW;

  const dayBase = {
    intro_day: ["intro_day_run"],
    intro_night: ["intro_night_run"],
    day: { steps: ["day_vote", "day_elim"] },
  };

  FLOW.mozaker = Object.assign({}, dayBase, {
    night: ["night_mafia", "night_doctor", "night_detective", "night_negotiator", "night_reporter"],
  });
  FLOW.takavar = Object.assign({}, dayBase, {
    day: { steps: ["day_guns?", "day_gun_expiry?", "day_vote", "day_elim"] },
    night: ["night_guardian", "night_hostageTaker", "night_mafia", "night_detective", "night_commando", "night_doctor", "night_gunner"],
  });
  FLOW.meeting_epic = Object.assign({}, dayBase, {
    night: ["night_natasha", "night_mafia", "night_lecter", "night_doctor", "night_detective", "night_sniper"],
  });
  FLOW.shab_mafia = Object.assign({}, dayBase, {
    night: ["night_mafia", "night_lecter", "night_joker_mafia", "night_detective", "night_professional", "night_doctor"],
  });
  FLOW.classicPro = Object.assign({}, dayBase, {
    night: [
      "night_guardian",
      "night_doubler",
      "night_bartender",
      "night_enchantress",
      "night_thief",
      "night_natasha",
      "night_yakuza",
      "night_outcast",
      "night_mafiaLawyer",
      "night_shahkesh",
      "night_psycho",
      "night_ladyVoodoo",
      "night_mafia",
      "night_surgeon",
      "night_psychShooter",
      "night_doctor",
      "night_armorer",
      "night_freemason",
      "night_gunmaker",
      "night_devout",
      "night_leader",
      "night_detective",
      "night_specialDetective",
      "night_sniper",
      "night_tracker",
      "night_wizard",
      "night_antiLadyVoodoo",
      "night_snowman",
      "night_priest",
      "night_perizad",
      "night_reaper",
      "night_killer",
      "night_nero",
      "night_jackIndep",
      "night_gamblerIndep",
    ],
  });
})();

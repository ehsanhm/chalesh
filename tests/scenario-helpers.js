/**
 * Shared helpers for scenario flow tests.
 * Exports window.SH with setup, atNight, nightStepIds utilities.
 * Must be loaded after flow-engine.js (needs ensureFlow, getFlowSteps, addFlowEvent).
 */
(function () {
  "use strict";

  /**
   * Reset and set up a scenario with a given list of roleIds.
   * Returns the flow object (f).
   */
  function setup(scenarioId, roleIds) {
    appState.ui.scenario = scenarioId;
    appState.draw = {
      players: roleIds.map(function (r) { return { roleId: r, alive: true }; }),
      uiAtDraw: { scenario: scenarioId },
    };
    if (!appState.god) appState.god = {};
    appState.god.flow = null;
    return ensureFlow();
  }

  /**
   * Position flow at the last step of a night phase for a given day,
   * record night actions in draft and event log.
   * Must be called after setup().
   */
  function atNight(f, day, nightActions) {
    f.phase = "night";
    f.day = day;
    if (!f.draft) f.draft = {};
    if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
    f.draft.nightActionsByNight[String(day)] = nightActions;
    var steps = getFlowSteps(f);
    f.step = Math.max(0, steps.length - 1);
    addFlowEvent("night_actions", nightActions);
  }

  /**
   * Returns array of step IDs for the current flow state.
   */
  function stepIds(f) {
    return getFlowSteps(f).map(function (s) { return s.id; });
  }

  /**
   * Count alive players matching predicate fn(player) => bool.
   */
  function aliveCount(predicate) {
    var players = (appState.draw && appState.draw.players) || [];
    return players.filter(function (p) { return p && p.alive !== false && predicate(p); }).length;
  }

  /**
   * Count alive players by team label (FA: "مافیا", "شهر", "مستقل").
   */
  function aliveTeam(teamFa) {
    return aliveCount(function (p) {
      var role = roles[p.roleId || "citizen"];
      return !!(role && role.teamFa === teamFa);
    });
  }

  window.SH = { setup: setup, atNight: atNight, stepIds: stepIds, aliveCount: aliveCount, aliveTeam: aliveTeam };
})();

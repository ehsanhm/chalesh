/**
 * Tests that Constantine can only revive one player per game.
 * A second revive attempt in a later night has no effect.
 *
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupPedarkhande() {
    appState.ui.scenario = "pedarkhande";
    appState.draw = {
      players: [
        { roleId: "godfather", alive: true },
        { roleId: "watson", alive: true },
        { roleId: "leon", alive: true },
        { roleId: "citizenKane", alive: true },
        { roleId: "constantine", alive: true },
        { roleId: "citizen", alive: true },
      ],
      uiAtDraw: { scenario: "pedarkhande" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  function applyDayElimManually(f, day, outIdx) {
    if (!f.draft) f.draft = {};
    f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
    const prevAlive = appState.draw.players[outIdx] && appState.draw.players[outIdx].alive !== false;
    f.draft.dayElimAppliedByDay[String(day)] = { out: outIdx, prevAlive };
    setPlayerLife(outIdx, { alive: false, reason: "vote" });
    f.events = f.events || [];
    f.events.push({ kind: "day_elim", phase: "day", day, data: { out: outIdx } });
    f.events.push({ kind: "day_elim_out", phase: "day", day, data: { out: outIdx } });
  }

  const suite = {
    name: "constantine-once-per-game",
    tests: [
      {
        name: "Constantine can only revive one player per game",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupPedarkhande();
          const draw = appState.draw.players;
          const victimA = 5; // citizen
          const victimB = 3; // citizenKane
          if (!draw[victimA] || !draw[victimB]) return;

          // Day 1: vote out victimA
          f.phase = "day";
          f.day = 1;
          f.step = 0;
          applyDayElimManually(f, 1, victimA);

          // Night 1: Constantine revives victimA (first use — succeeds)
          f.phase = "night";
          f.day = 1;
          const nightSteps1 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps1.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            constantineRevive: victimA,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            constantineRevive: victimA,
          });

          nextFlowStep(); // Night 1 -> Day 2
          assert(draw[victimA].alive === true, "Constantine should have revived victimA on Night 1");

          // Day 2: vote out victimB
          f.phase = "day";
          f.day = 2;
          f.step = 0;
          applyDayElimManually(f, 2, victimB);

          // Night 2: Constantine tries to revive victimB (second use — blocked)
          f.phase = "night";
          f.day = 2;
          const nightSteps2 = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps2.length - 1);
          f.draft.nightActionsByNight["2"] = {
            godfatherAction: "shoot",
            mafiaShot: null,
            constantineRevive: victimB,
          };
          addFlowEvent("night_actions", {
            godfatherAction: "shoot",
            mafiaShot: null,
            constantineRevive: victimB,
          });

          nextFlowStep(); // Night 2 -> Day 3

          assert(
            draw[victimB].alive === false,
            "Constantine cannot revive a second time — victimB should remain dead"
          );
        },
      },
    ],
  };

  window.CONSTANTINE_ONCE_PER_GAME_TESTS = suite;
})();

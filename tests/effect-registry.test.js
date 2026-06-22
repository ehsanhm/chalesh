/**
 * Tests for effect registry.
 * Run from tests/run.html (loads flow-engine, effect-registry, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  const suite = {
    name: "effect-registry",
    tests: [
      {
        name: "registerEffect and hasEffect",
        fn: function ({ assert, assertEqual }) {
          assert(typeof window.registerEffect === "function");
          assert(typeof window.hasEffect === "function");
          assert(typeof window.applyEffect === "function");
          assert(typeof window.revertEffect === "function");

          const applied = [];
          const reverted = [];
          window.registerEffect("_test_effect", {
            apply: function (ctx) {
              applied.push(ctx);
              return true;
            },
            revert: function (ctx) {
              reverted.push(ctx);
              return true;
            },
          });
          assert(window.hasEffect("_test_effect"));
          assertEqual(applied.length, 0);
          assertEqual(reverted.length, 0);

          window.applyEffect("_test_effect", { f: 1, payload: { x: 2 } });
          assertEqual(applied.length, 1);
          assertEqual(applied[0].payload.x, 2);

          window.revertEffect("_test_effect", { f: 1 });
          assertEqual(reverted.length, 1);

          // Cleanup
          delete window.EFFECT_REGISTRY["_test_effect"];
        },
      },
      {
        name: "apply then revert restores state (mock effect)",
        fn: function ({ assert, assertEqual }) {
          let state = null;
          window.registerEffect("_test_restore", {
            apply: function (ctx) {
              state = ctx.payload.value;
              return true;
            },
            revert: function () {
              state = null;
              return true;
            },
          });

          assertEqual(state, null);
          window.applyEffect("_test_restore", { payload: { value: 42 } });
          assertEqual(state, 42);
          window.revertEffect("_test_restore", {});
          assertEqual(state, null);

          delete window.EFFECT_REGISTRY["_test_restore"];
        },
      },
      {
        name: "day_elim is registered (integration)",
        fn: function ({ assert }) {
          if (typeof applyDayElimFromPayload !== "function") {
            return; // Skip if flow-engine not loaded
          }
          assert(window.hasEffect("day_elim"));
          const h = window.EFFECT_REGISTRY["day_elim"];
          assert(h && h.apply && h.revert);
        },
      },
      {
        name: "night_resolution is registered (integration)",
        fn: function ({ assert }) {
          if (typeof resolveNightFromPayload !== "function") {
            return;
          }
          assert(window.hasEffect("night_resolution"));
          const h = window.EFFECT_REGISTRY["night_resolution"];
          assert(h && h.apply && h.revert);
        },
      },
      {
        name: "day_elim apply then revert leaves player alive (integration)",
        fn: function ({ assert }) {
          if (typeof applyDayElimFromPayload !== "function" || !appState || !appState.draw) {
            return;
          }
          // Setup: ensure we have a draw with at least one player
          const draw = appState.draw;
          if (!draw || !draw.players || draw.players.length < 2) return;

          const f = typeof ensureFlow === "function" ? ensureFlow() : null;
          if (!f) return;

          const playerIdx = 0;
          const wasAlive = draw.players[playerIdx] && draw.players[playerIdx].alive !== false;
          if (!wasAlive) return; // Skip if player already dead

          // Apply: vote out player 0
          const applied = window.applyEffect("day_elim", { f, payload: { out: playerIdx } });
          if (!applied) return;
          assert(draw.players[playerIdx].alive === false, "Player should be dead after apply");

          // Revert
          window.revertEffect("day_elim", { f });
          assert(draw.players[playerIdx].alive === true, "Player should be alive after revert");
        },
      },
    ],
  };

  window.EFFECT_REGISTRY_TESTS = suite;
})();

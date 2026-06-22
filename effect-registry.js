/**
 * Effect registry — central apply/revert for flow steps.
 * Each step that changes game state registers { apply, revert }.
 * Flow engine calls applyEffect/revertEffect instead of scattered applyXxx/revertXxx.
 *
 * Usage:
 *   registerEffect("day_elim", { apply: (ctx) => ..., revert: (ctx) => ... });
 *   applyEffect("day_elim", { f, payload: { out: 3 } });
 *   revertEffect("day_elim", { f });
 */
(function () {
  "use strict";
  window.EFFECT_REGISTRY = window.EFFECT_REGISTRY || {};

  window.registerEffect = function (stepId, handlers) {
    if (!stepId || typeof stepId !== "string") return;
    window.EFFECT_REGISTRY[stepId] = {
      apply: typeof handlers.apply === "function" ? handlers.apply : null,
      revert: typeof handlers.revert === "function" ? handlers.revert : null,
    };
  };

  window.applyEffect = function (stepId, ctx) {
    const h = window.EFFECT_REGISTRY[stepId];
    if (!h || !h.apply) return false;
    try {
      return h.apply(ctx) !== false;
    } catch (e) {
      try { console.warn("applyEffect", stepId, e); } catch {}
      return false;
    }
  };

  window.revertEffect = function (stepId, ctx) {
    const h = window.EFFECT_REGISTRY[stepId];
    if (!h || !h.revert) return false;
    try {
      return h.revert(ctx) !== false;
    } catch (e) {
      try { console.warn("revertEffect", stepId, e); } catch {}
      return false;
    }
  };

  window.hasEffect = function (stepId) {
    return !!(window.EFFECT_REGISTRY[stepId] && (window.EFFECT_REGISTRY[stepId].apply || window.EFFECT_REGISTRY[stepId].revert));
  };

  // Register effects — must run after flow-engine.js (which defines applyXxx, revertXxx)
  function registerBuiltInEffects() {
    // Night resolution (mafia shot, doctor save, etc.) — apply all at dawn, revert when going back
    if (typeof resolveNightFromPayload === "function" && typeof revertNightDeaths === "function") {
      window.registerEffect("night_resolution", {
        apply: function (ctx) {
          return resolveNightFromPayload(ctx.f, ctx.payload || {});
        },
        revert: function (ctx) {
          const nightDayNum = ctx.nightDayNum != null ? Number(ctx.nightDayNum) : Math.max(0, (ctx.f && ctx.f.day) || 1) - 1;
          revertNightDeaths(ctx.f, nightDayNum);
          return true;
        },
      });
    }

    if (typeof applyDayElimFromPayload !== "function") return;

    function makeElimEffect(hasApply) {
      return {
        apply: hasApply ? function (ctx) { return applyDayElimFromPayload(ctx.f, ctx.payload || {}); } : null,
        revert: function (ctx) { return applyDayElimFromPayload(ctx.f, { out: null }); },
      };
    }

    window.registerEffect("day_elim", makeElimEffect(true));
    window.registerEffect("namayande_vote", makeElimEffect(true));
    window.registerEffect("kabo_shoot", makeElimEffect(false));

    if (typeof applyBazrasInterrogationFromPayload === "function") {
      window.registerEffect("bazras_forced_vote", {
        revert: function (ctx) {
          const d = (ctx.f && ctx.f.draft) || {};
          const dayKey = String((ctx.f && ctx.f.day) || 1);
          const rec = (d.bazrasInterrogationByDay && d.bazrasInterrogationByDay[dayKey]) || {};
          return applyBazrasInterrogationFromPayload(ctx.f, { decision: rec.decision || null, outcome: null });
        },
      });
    }
    if (typeof revertGunExpiryForDay === "function") {
      window.registerEffect("day_gun_expiry", {
        revert: function (ctx) {
          return revertGunExpiryForDay(ctx.f);
        },
      });
    }
    if (typeof revertGunShotsForDay === "function") {
      window.registerEffect("day_guns", {
        revert: function (ctx) {
          return revertGunShotsForDay(ctx.f);
        },
      });
    }
    if (typeof revertKaneRevealForDay === "function") {
      window.registerEffect("day_kane_reveal", {
        revert: function (ctx) {
          return revertKaneRevealForDay(ctx.f);
        },
      });
    }
    if (typeof revertEndCardActionForDay === "function") {
      window.registerEffect("day_end_card_action", {
        revert: function (ctx) {
          return revertEndCardActionForDay(ctx.f);
        },
      });
    }
  }

  // Run after flow-engine.js (load effect-registry after flow-engine in index.html)
  registerBuiltInEffects();
})();

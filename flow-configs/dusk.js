/**
 * Dusk resolution step — shown as last step every day.
 * Displays who left the game during the day (vote-out, kabo shot, gun expiry, etc.).
 * Same data as Status Check Eliminated for day phase.
 */
(function () {
  "use strict";
  if (typeof window.registerStepRenderer !== "function") return;

  function renderDayDuskResolution(ctx) {
    const { f, names, draw, escapeHtml, t, roles, appLang, ROLE_I18N, getEliminatedForStatusCheck } = ctx;
    const currentDay = f.day || 1;
    const eliminated = (typeof getEliminatedForStatusCheck === "function" && f)
      ? getEliminatedForStatusCheck(f, currentDay, "day")
      : [];
    const plainNameOf = (idx) => (names && names[idx]) ? names[idx] : (typeof t === "function" ? t("common.playerN", { n: (idx || 0) + 1 }) : "Player " + (idx + 1));
    const roleNameOf = (idx) => {
      const players = draw && draw.players;
      const roleId = players && players[idx] && players[idx].roleId;
      if (!roleId) return "";
      const r = roles && roles[roleId];
      if (r) {
        return (appLang === "fa" && r.faName) ? r.faName : (ROLE_I18N && ROLE_I18N[roleId] && ROLE_I18N[roleId].name) ? ROLE_I18N[roleId].name : roleId;
      }
      return (ROLE_I18N && ROLE_I18N[roleId] && ROLE_I18N[roleId].name) ? ROLE_I18N[roleId].name : roleId;
    };
    const elimLabel = t("tool.flow.dusk.eliminated");
    const noneLabel = t("tool.flow.dusk.none");
    const isRtl = typeof appLang !== "undefined" && appLang === "fa";
    const elimRows = eliminated.length
      ? eliminated.map((idx) => {
          const name = escapeHtml(plainNameOf(idx));
          const role = escapeHtml(roleNameOf(idx));
          return `<div style="margin-bottom:6px">${name}${role ? ` <span style="opacity:.65;font-weight:600">(${role})</span>` : ""}</div>`;
        }).join("")
      : `<div>${escapeHtml(noneLabel)}</div>`;
    return `
      <div style="text-align:center; padding:20px 0 10px">
        <div style="font-size:13px; font-weight:950; color:var(--muted); margin-bottom:14px; ${isRtl ? "" : "text-transform:uppercase; letter-spacing:.05em;"}">${escapeHtml(t("tool.flow.dusk.title"))}</div>
        <div style="text-align:${isRtl ? "right" : "left"}; margin:0 auto; max-width:320px">
          <div class="fl-say-label" style="margin-bottom:8px">${escapeHtml(t("fl.label.sayAloud"))}</div>
          <div class="fl-script" style="border-radius:10px; margin:0">
            <div style="color:rgba(255,110,70,.95); font-weight:1000; margin-bottom:8px">${escapeHtml(elimLabel)}</div>
            <div>${elimRows}</div>
          </div>
        </div>
      </div>
    `;
  }

  window.registerStepRenderer("day_dusk_resolution", renderDayDuskResolution);
})();

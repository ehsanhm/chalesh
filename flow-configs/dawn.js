/**
 * Dawn resolution step — shown as first step every morning (Day 2+).
 * Displays who died and who was revived during the previous night.
 * Same data as Status Check Eliminated/Revived lists.
 */
(function () {
  "use strict";
  if (typeof window.registerStepRenderer !== "function") return;

  function renderDayDawnResolution(ctx) {
    const { f, names, draw, escapeHtml, t, roles, appLang, ROLE_I18N, getEliminatedForStatusCheck, getRevivedForStatusCheck } = ctx;
    const prevNightDay = Math.max(1, (f.day || 1) - 1);
    const eliminated = (typeof getEliminatedForStatusCheck === "function" && f)
      ? getEliminatedForStatusCheck(f, prevNightDay, "night")
      : [];
    const revived = (typeof getRevivedForStatusCheck === "function" && f)
      ? getRevivedForStatusCheck(f, prevNightDay, "night")
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
    const elimLabel = t("tool.flow.dawn.eliminated");
    const revLabel = t("tool.flow.dawn.revived");
    const noneLabel = t("tool.flow.dawn.none");
    const isRtl = typeof appLang !== "undefined" && appLang === "fa";
    const mkRows = (idxs) => idxs.length
      ? idxs.map((idx) => {
          const name = escapeHtml(plainNameOf(idx));
          const role = escapeHtml(roleNameOf(idx));
          return `<div style="margin-bottom:4px">${name}${role ? ` <span style="opacity:.65;font-weight:600">(${role})</span>` : ""}</div>`;
        }).join("")
      : `<span>${escapeHtml(noneLabel)}</span>`;
    return `
      <div style="text-align:center; padding:20px 0 10px">
        <div style="font-size:13px; font-weight:950; color:var(--muted); margin-bottom:14px; ${isRtl ? "" : "text-transform:uppercase; letter-spacing:.05em;"}">${escapeHtml(t("tool.flow.dawn.title"))}</div>
        <div style="text-align:${isRtl ? "right" : "left"}; margin:0 auto; max-width:320px">
          <div class="fl-say-label" style="margin-bottom:8px">${escapeHtml(t("fl.label.sayAloud"))}</div>
          <div class="fl-script" style="border-radius:10px; margin:0">
            <div style="margin-bottom:10px; color:rgba(255,110,70,.95); font-weight:1000; margin-bottom:6px">${escapeHtml(elimLabel)}</div>
            <div style="margin-bottom:14px">${mkRows(eliminated)}</div>
            <div style="color:rgba(74,222,128,.95); font-weight:1000; margin-bottom:6px">${escapeHtml(revLabel)}</div>
            <div>${mkRows(revived)}</div>
          </div>
        </div>
      </div>
    `;
  }

  window.registerStepRenderer("day_dawn_resolution", renderDayDawnResolution);
})();

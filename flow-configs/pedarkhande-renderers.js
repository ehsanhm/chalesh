/**
 * Pedarkhande (Godfather) scenario — step renderers.
 * Registers custom UI for intro_night_nostradamus, nostradamus_choose_side,
 * intro_night_mafia, intro_night_wake_order, day_kane_reveal.
 * Load after flow-ui.js.
 */
(function () {
  "use strict";
  if (typeof window.registerStepRenderer !== "function") return;

  function renderIntroNightNostradamus(ctx) {
    const { cur, f, draw, names, mkNightMultiPickCards, escapeHtml, appLang, t } = ctx;
    const d = f.draft || {};
    if (!d.nightActionsByNight || typeof d.nightActionsByNight !== "object") d.nightActionsByNight = {};
    if (!d.nightActionsByNight["0"] || !(d.nightActionsByNight["0"].nostPick3?.length)) {
      try {
        const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "intro_night" && e.data);
        if (ev && ev.data && typeof ev.data === "object" && Array.isArray(ev.data.nostPick3) && ev.data.nostPick3.length) {
          if (!d.nightActionsByNight["0"]) d.nightActionsByNight["0"] = {};
          d.nightActionsByNight["0"].nostPick3 = ev.data.nostPick3.slice(0, 3);
          f.draft = d;
          try { if (typeof ctx.saveState === "function" && ctx.appState) ctx.saveState(ctx.appState); } catch {}
        }
      } catch {}
    }
    const introNight = (d.nightActionsByNight && d.nightActionsByNight["0"]) ? d.nightActionsByNight["0"] : {};
    const savedNostPick3 = Array.isArray(introNight.nostPick3) ? introNight.nostPick3.slice(0, 3) : [];
    const hasNostradamus = (draw.players || []).some((p) => p && p.roleId === "nostradamus");
    const nostSection = !hasNostradamus ? `<div class="note">${escapeHtml(appLang === "fa" ? "نوستراداموس در بازی نیست." : "No Nostradamus in this game.")}</div>` : (() => {
      const cleanArr = savedNostPick3.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x));
      const nostradamusIdx = (draw.players || []).findIndex((p) => p && p.roleId === "nostradamus");
      const allIdxs = (draw.players || []).map((_, i) => i).filter((i) => i !== nostradamusIdx);
      const nostRes = (d.nostResultByNight && d.nostResultByNight["0"]) ? d.nostResultByNight["0"] : null;
      const mafiaCount = (nostRes && nostRes.mafiaCount !== undefined && nostRes.mafiaCount !== null) ? nostRes.mafiaCount : 0;
      const n = cleanArr.length;
      const fn = (appLang === "fa" && typeof toFarsiNum === "function") ? toFarsiNum : String;
      const nostResultLine = n > 0
        ? (appLang === "fa" ? `نتیجه: ${fn(mafiaCount)} نفر از این ${fn(n)} نفر مافیا هستند.` : `Result: ${mafiaCount} of these ${n} are Mafia.`)
        : (appLang === "fa" ? "نتیجه: —" : "Result: —");
      const cardsHtml = mkNightMultiPickCards("fl_intro_nost_pick3", cleanArr, 3, appLang === "fa" ? "انتخاب ۳ نفر (کارت‌ها را لمس کنید)" : "Pick 3 players (tap cards)", allIdxs, { intro: true });
      return `
        <div class="note" style="margin-bottom:6px">${escapeHtml(appLang === "fa" ? "۳ نفر را انتخاب کنید. گرداننده تعداد مافیاهای بین آن‌ها را اعلام می‌کند (پدرخوانده مافیا حساب نمی‌شود)." : "Pick 3 players. Host announces how many of them are Mafia (Godfather doesn't count).")}</div>
        ${cardsHtml}
        <div id="fl_intro_nost_result" class="note result" style="margin-top:8px">${escapeHtml(nostResultLine)}</div>
      `;
    })();
    return nostSection;
  }

  function renderNostradamusChooseSide(ctx) {
    const { f, NIGHT_CARD_BASE, NIGHT_CARD_IDLE, NIGHT_CARD_SEL, escapeHtml, appLang } = ctx;
    const d = f.draft || {};
    const nostRes = (d.nostResultByNight && d.nostResultByNight["0"]) ? d.nostResultByNight["0"] : null;
    const mafiaCount = (nostRes && nostRes.mafiaCount !== undefined && nostRes.mafiaCount !== null) ? Number(nostRes.mafiaCount) : 0;
    const forcedMafia = mafiaCount >= 2;
    const savedSide = (d.nostradamusChosenSide === "mafia" || d.nostradamusChosenSide === "citizen") ? d.nostradamusChosenSide : (forcedMafia ? "mafia" : null);
    const validationMsg = (d.nostradamusChooseSideError && typeof d.nostradamusChooseSideError === "string") ? d.nostradamusChooseSideError : "";
    const citizenLabel = appLang === "fa" ? "شهروندان" : "Citizens";
    const mafiaLabel = appLang === "fa" ? "مافیا" : "Mafia";
    const citizenSel = savedSide === "citizen";
    const mafiaSel = savedSide === "mafia" || forcedMafia;
    const citizenDis = forcedMafia ? ' data-disabled="true"' : "";
    const mafiaDis = forcedMafia ? "" : "";
    const citizenStyle = forcedMafia ? "opacity:.55;pointer-events:none;" : "";
    const fn = (appLang === "fa" && typeof toFarsiNum === "function") ? toFarsiNum : String;
    return `
      <div class="note" style="margin-bottom:8px">${escapeHtml(forcedMafia
        ? (appLang === "fa" ? `از ۳ نفر انتخاب‌شده، ${fn(mafiaCount)} نفر مافیا هستند. نوستراداموس باید ساید مافیا را انتخاب کند.` : `Of the 3 picked, ${mafiaCount} are Mafia. Nostradamus must choose the Mafia side.`)
        : (appLang === "fa" ? "نوستراداموس ساید خود را انتخاب می‌کند." : "Nostradamus chooses their side."))}</div>
      <input type="hidden" id="fl_nostradamus_side" value="${escapeHtml(savedSide || "")}">
      <div class="nightTargetGroup" data-field="fl_nostradamus_side" style="margin-top:10px">
        <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:10px; max-width:320px">
          <button class="nightPlayerCard" type="button" data-field="fl_nostradamus_side" data-idx="citizen"${citizenDis} style="${NIGHT_CARD_BASE}${citizenSel ? NIGHT_CARD_SEL : NIGHT_CARD_IDLE}${citizenStyle}">${escapeHtml(citizenLabel)}</button>
          <button class="nightPlayerCard" type="button" data-field="fl_nostradamus_side" data-idx="mafia"${mafiaDis} style="${NIGHT_CARD_BASE}${mafiaSel ? NIGHT_CARD_SEL : NIGHT_CARD_IDLE}">${escapeHtml(mafiaLabel)}</button>
        </div>
      </div>
      ${validationMsg ? `<div class="note alert" id="fl_nostradamus_side_note" style="margin-top:10px">${escapeHtml(validationMsg)}</div>` : `<div class="note alert" id="fl_nostradamus_side_note" style="display:none; margin-top:10px"></div>`}
      ${forcedMafia ? `<div class="note" style="margin-top:8px; color:var(--muted)">${escapeHtml(appLang === "fa" ? "انتخاب اجباری: مافیا" : "Forced choice: Mafia")}</div>` : ""}
    `;
  }

  function renderIntroNightMafia(ctx) {
    const { draw, names, roles, ROLE_RANK, ROLE_I18N, escapeHtml, appLang, t } = ctx;
    const mafiaPlayers = (draw.players || []).map((p, idx) => ({ p, idx })).filter(({ p }) => {
      if (!p) return false;
      const role = roles[p.roleId];
      return role && role.teamFa === "مافیا";
    });
    const roleRank = (rid) => (typeof ROLE_RANK !== "undefined" && ROLE_RANK[rid] != null) ? ROLE_RANK[rid] : 500;
    mafiaPlayers.sort((a, b) => (roleRank(a.p.roleId) - roleRank(b.p.roleId)) || (a.idx - b.idx));
    const mafiaListHtml = mafiaPlayers.length
      ? mafiaPlayers.map(({ p, idx }) => {
          const nm = names[idx] || t("common.playerN", { n: idx + 1 });
          const r = roles[p.roleId];
          const roleLabel = r ? ((appLang === "fa" && r.faName) ? r.faName : (ROLE_I18N && ROLE_I18N[p.roleId] && ROLE_I18N[p.roleId].name) ? ROLE_I18N[p.roleId].name : p.roleId) : p.roleId;
          return `<div style="padding:4px 0">${escapeHtml(nm)} — ${escapeHtml(roleLabel)}</div>`;
        }).join("")
      : `<div class="note">${escapeHtml(appLang === "fa" ? "مافیایی در بازی نیست." : "No mafia players.")}</div>`;
    return `
      <div class="note fl-moderator-info" style="margin-bottom:8px">${escapeHtml(appLang === "fa" ? "گرداننده تیم مافیا را بیدار می‌کند و از هر کدام می‌خواهد با نشان دادن ژست «لایک» تأیید کند که نقش خود را می‌شناسد. هیچ اکشنی در شب معارفه ثبت نمی‌شود." : "God wakes the mafia team and asks each to show a \"Like\" hand gesture to confirm they know who is mafia. No actions on intro night.")}</div>
      ${mafiaListHtml}
    `;
  }

  function renderIntroNightWakeOrder(ctx) {
    const { draw, names, escapeHtml, appLang, t } = ctx;
    const wakeRoles = [
      { rid: "watson", fa: "دکتر واتسون", en: "Dr. Watson" },
      { rid: "leon", fa: "لئون", en: "Leon" },
      { rid: "citizenKane", fa: "همشهری کین", en: "Citizen Kane" },
      { rid: "constantine", fa: "کنستانتین", en: "Constantine" },
    ];
    const wakeList = wakeRoles.map(({ rid, fa, en }) => {
      const idx = (draw.players || []).findIndex((p) => p && p.roleId === rid);
      const nm = idx >= 0 ? (names[idx] || t("common.playerN", { n: idx + 1 })) : "—";
      const label = appLang === "fa" ? fa : en;
      return `<div style="padding:4px 0">${escapeHtml(label)} — ${escapeHtml(nm)}</div>`;
    }).join("");
    return `
      <div class="note fl-moderator-info" style="margin-bottom:8px">${escapeHtml(appLang === "fa" ? "گرداننده این نقش‌ها را به ترتیب بیدار می‌کند و از هر کدام می‌خواهد با نشان دادن ژست «لایک» تأیید کند که از نقش خود آگاه است. هیچ اکشنی در شب معارفه ثبت نمی‌شود." : "God wakes these roles in order and asks each to show a \"Like\" hand gesture to confirm they are aware of their role. No actions on intro night.")}</div>
      ${wakeList}
    `;
  }

  function renderDayKaneReveal(ctx) {
    const { cur, f, names, escapeHtml, t } = ctx;
    const prevNight = (f.day || 1) - 1;
    const kaneEv = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNight && e.data);
    const kanePayload = kaneEv && kaneEv.data ? kaneEv.data : null;
    const kaneRaw = kanePayload ? kanePayload.kaneMark : null;
    const kaneIdx = (kaneRaw !== null && kaneRaw !== undefined && Number.isFinite(parseInt(kaneRaw, 10))) ? parseInt(kaneRaw, 10) : null;
    const kaneName = kaneIdx !== null ? escapeHtml(names[kaneIdx] || t("common.playerN", { n: kaneIdx + 1 })) : "?";
    return `
      <div style="text-align:center; padding:20px 0 10px">
        <div style="font-size:13px; font-weight:950; color:var(--muted); margin-bottom:18px; text-transform:uppercase; letter-spacing:.05em">${escapeHtml(t("tool.flow.kane.revealTitle"))}</div>
        <div style="font-size:22px; font-weight:1100; color:rgba(255,220,180,1); margin-bottom:14px; padding:14px 18px; background:rgba(220,53,69,.18); border:2px solid rgba(220,53,69,.55); border-radius:14px; display:inline-block; min-width:120px">${kaneName}</div>
        <div class="note" style="margin-top:14px">${escapeHtml(t("tool.flow.kane.revealBody"))}</div>
        <div class="note" style="margin-top:10px">${escapeHtml(ctx.appLang === "fa" ? "نقش این بازیکن افشا می‌شود ولی در بازی می‌ماند. شب بعد همشهری کین با تیر غیب از بازی خارج می‌شود." : "This player's role is revealed but they remain in the game. Citizen Kane is eliminated the following night (invisible bullet).")}</div>
      </div>
    `;
  }

  window.registerStepRenderer("intro_night_nostradamus", renderIntroNightNostradamus);
  window.registerStepRenderer("nostradamus_choose_side", renderNostradamusChooseSide);
  window.registerStepRenderer("intro_night_mafia", renderIntroNightMafia);
  window.registerStepRenderer("intro_night_wake_order", renderIntroNightWakeOrder);
  window.registerStepRenderer("day_kane_reveal", renderDayKaneReveal);
})();

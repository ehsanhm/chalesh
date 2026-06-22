        function flowRecordTimestamp(date = new Date()) {
          try {
            if (typeof recordTimestamp === "function") return recordTimestamp(date);
          } catch {}
          try {
            if (typeof californiaTimestamp === "function") return californiaTimestamp(date);
          } catch {}
          const d = date instanceof Date ? date : new Date(date);
          return Number.isNaN(d.getTime()) ? new Date().toISOString() : d.toISOString();
        }

        function flowRecordTimestampMs(value) {
          try {
            if (typeof recordTimestampMs === "function") return recordTimestampMs(value);
          } catch {}
          if (value === null || value === undefined || value === "") return 0;
          if (typeof value === "number") return Number.isFinite(value) ? value : 0;
          if (typeof value === "string") {
            const trimmed = value.trim();
            if (!trimmed) return 0;
            if (/^\d+$/.test(trimmed)) {
              const n = Number(trimmed);
              return Number.isFinite(n) ? n : 0;
            }
            const parsed = Date.parse(trimmed);
            return Number.isFinite(parsed) ? parsed : 0;
          }
          const parsed = Date.parse(value);
          return Number.isFinite(parsed) ? parsed : 0;
        }

        function ensureFlow() {
          if (!appState.god) appState.god = {};
          if (!appState.god.flow || typeof appState.god.flow !== "object") {
            appState.god.flow = {
              day: 1,
              phase: "intro_day", // intro_day | intro_night | day | night
              step: 0,
              bombActive: false,
              guns: {}, // idx -> { type: "real"|"fake", used: boolean, givenAt }
              events: [], // { at, phase, day, kind, data }
              draft: { challengeUsedByDay: {} }, // ui-only scratch (not required but persisted ok)
            };
          }
          if (!Array.isArray(appState.god.flow.events)) appState.god.flow.events = [];
          if (!appState.god.flow.guns || typeof appState.god.flow.guns !== "object") appState.god.flow.guns = {};
          if (typeof appState.god.flow.day !== "number" || appState.god.flow.day < 1) appState.god.flow.day = 1;
          // Mid-day step was removed; migrate older saves.
          if (appState.god.flow.phase === "midday") {
            appState.god.flow.phase = "day";
            appState.god.flow.step = 0;
          }
          if (!["intro_day", "intro_night", "day", "night", "chaos", "winner"].includes(appState.god.flow.phase)) appState.god.flow.phase = "day";
          if (typeof appState.god.flow.step !== "number" || appState.god.flow.step < 0) appState.god.flow.step = 0;
          if (typeof appState.god.flow.bombActive !== "boolean") appState.god.flow.bombActive = false;
          if (!appState.god.flow.draft || typeof appState.god.flow.draft !== "object") appState.god.flow.draft = {};
          return appState.god.flow;
        }

        function getDrawScenarioForFlow() {
          return (appState.draw && appState.draw.uiAtDraw && appState.draw.uiAtDraw.scenario)
            ? appState.draw.uiAtDraw.scenario
            : getScenario();
        }

        function isDevilScenario() {
          return String(getDrawScenarioForFlow() || "").toLowerCase() === "devil";
        }

        function parseFlowPlayerIndex(raw, players) {
          const n = parseInt(raw, 10);
          const max = players && players.length ? players.length : 0;
          return Number.isFinite(n) && n >= 0 && n < max ? n : null;
        }

        function getFlowRoleId(idx) {
          const draw = appState.draw;
          const p = draw && draw.players && draw.players[idx];
          return (p && p.roleId) ? p.roleId : "citizen";
        }

        function isDevilRoleType(roleId, type) {
          const r = roles && roles[roleId];
          return !!(r && r.botcType === type);
        }

        function findAliveDevilRole(roleId) {
          const draw = appState.draw;
          if (!draw || !draw.players) return null;
          for (let i = 0; i < draw.players.length; i++) {
            const p = draw.players[i];
            if (p && p.roleId === roleId && p.alive !== false) return i;
          }
          return null;
        }

        function findAliveDevilMinion(preferredIdx, excludeIdx) {
          const draw = appState.draw;
          if (!draw || !draw.players) return null;
          const isEligible = (idx) => {
            const p = draw.players[idx];
            return !!(p && p.alive !== false && idx !== excludeIdx && isDevilRoleType(p.roleId, "minion"));
          };
          if (preferredIdx !== null && preferredIdx !== undefined && Number.isFinite(Number(preferredIdx))) {
            const idx = parseInt(preferredIdx, 10);
            if (idx >= 0 && idx < draw.players.length && isEligible(idx)) return idx;
          }
          for (let i = 0; i < draw.players.length; i++) {
            if (isEligible(i)) return i;
          }
          return null;
        }

        function devilAliveCount() {
          const draw = appState.draw;
          if (!draw || !draw.players) return 0;
          return draw.players.filter((p) => p && p.alive !== false).length;
        }

        function devilIsPoisonedOnDay(f, idx) {
          try {
            if (idx === null || idx === undefined || !Number.isFinite(Number(idx))) return false;
            const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
            const na = f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey];
            if (na && na.magicianDisable !== null && na.magicianDisable !== undefined && parseInt(na.magicianDisable, 10) === parseInt(idx, 10)) return true;
            if (prevNightKey === "0") {
              const si = f.draft && f.draft.stepInputs && f.draft.stepInputs.devil_intro_poisoner;
              const introPoison = si && (
                si.fl_magician_disable !== null && si.fl_magician_disable !== undefined && si.fl_magician_disable !== ""
                  ? si.fl_magician_disable
                  : si.devil_intro_poisoned
              );
              if (introPoison !== null && introPoison !== undefined && introPoison !== "" && parseInt(introPoison, 10) === parseInt(idx, 10)) return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        function devilIsPoisonedThisNight(payload, idx) {
          try {
            if (idx === null || idx === undefined || !Number.isFinite(Number(idx))) return false;
            return !!(payload && payload.magicianDisable !== null && payload.magicianDisable !== undefined && parseInt(payload.magicianDisable, 10) === parseInt(idx, 10));
          } catch {
            return false;
          }
        }

        function revertDevilPromotionRecord(f, rec, dayKey) {
          try {
            if (!rec || typeof rec !== "object") return;
            const draw = appState.draw;
            const idxRaw = (rec.impPassedTo !== null && rec.impPassedTo !== undefined) ? rec.impPassedTo : rec.devilPromoted;
            const prevRole = rec.impSuccessorPrevRoleId || rec.devilPromotedPrevRoleId || null;
            const idx = parseFlowPlayerIndex(idxRaw, draw && draw.players);
            if (idx !== null && prevRole && draw && draw.players && draw.players[idx]) {
              draw.players[idx].roleId = prevRole;
            }
            if (rec.devilPromotionReason === "scarlet_woman" && f && f.draft) {
              if (f.draft.devilScarletWomanUsedOnDay == null || String(f.draft.devilScarletWomanUsedOnDay) === String(dayKey)) {
                f.draft.devilScarletWomanUsed = false;
                f.draft.devilScarletWomanUsedOnDay = null;
              }
            }
            rec.devilPromoted = null;
            rec.devilPromotedPrevRoleId = null;
            rec.devilPromotionReason = null;
            rec.impPassedTo = null;
            rec.impSuccessorPrevRoleId = null;
          } catch {}
        }

        function promoteDevilPlayerToImp(f, rec, idx, reason) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players || idx === null || idx === undefined) return false;
            const n = parseFlowPlayerIndex(idx, draw.players);
            if (n === null) return false;
            const p = draw.players[n];
            if (!p || p.alive === false || p.roleId === "devilImp") return false;
            rec.devilPromoted = n;
            rec.devilPromotedPrevRoleId = p.roleId || null;
            rec.devilPromotionReason = reason || "imp_pass";
            if (reason === "imp_self_kill") {
              rec.impPassedTo = n;
              rec.impSuccessorPrevRoleId = p.roleId || null;
            }
            p.roleId = "devilImp";
            if (reason === "scarlet_woman" && f && f.draft) {
              f.draft.devilScarletWomanUsed = true;
              f.draft.devilScarletWomanUsedOnDay = f.day || 1;
            }
            return true;
          } catch {
            return false;
          }
        }

        function promoteDevilScarletWoman(f, rec, reason) {
          try {
            if (!isDevilScenario()) return false;
            const swIdx = findAliveDevilRole("devilScarletWoman");
            if (swIdx === null) return false;
            return promoteDevilPlayerToImp(f, rec, swIdx, reason || "scarlet_woman");
          } catch {
            return false;
          }
        }

        function setDevilWinner(f, winnerTeam, backPhase, backDay, backStep) {
          if (!f || !winnerTeam) return false;
          if (!f.draft || typeof f.draft !== "object") f.draft = {};
          f.draft.winnerBack = { phase: backPhase, day: backDay, step: backStep };
          f.draft.winnerFromChaos = false;
          f.draft.winnerTeam = winnerTeam;
          f.phase = "winner";
          f.step = 0;
          return true;
        }

        function getPlayerNamesForFlow() {
          const draw = appState.draw;
          const n = (draw && draw.players) ? draw.players.length : (appState.ui && appState.ui.nPlayers) ? appState.ui.nPlayers : 0;
          const names = [];
          for (let i = 0; i < n; i++) {
            const nm = (appState.ui.playerNames && appState.ui.playerNames[i]) ? appState.ui.playerNames[i] : t("common.playerN", { n: i + 1 });
            names.push(nm);
          }
          return names;
        }

        // ── Back-navigation helpers ───────────────────────────────────────────

        // Revert all deaths that were applied when transitioning from Night nightDayNum
        // to Day nightDayNum+1 (i.e. undo the effects of that night's resolution).
        function revertNightDeaths(f, nightDayNum) {
          try {
            const dayKey = String(nightDayNum);
            const d = f.draft || {};
            // Mafia shot
            if (d.nightMafiaAppliedByDay && d.nightMafiaAppliedByDay[dayKey]) {
              const rec = d.nightMafiaAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              // Also revert researcher chain kill (if researcher was the mafia target)
              if (Number.isFinite(Number(rec.chainKilled)) && rec.chainPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.chainKilled, 10), { alive: true }); } catch {}
              }
              try { revertDevilPromotionRecord(f, rec, dayKey); } catch {}
              d.nightMafiaAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Zodiac shot
            if (d.nightZodiacAppliedByDay && d.nightZodiacAppliedByDay[dayKey]) {
              const rec = d.nightZodiacAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightZodiacAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Ocean eliminated itself
            if (d.nightOceanAppliedByDay && d.nightOceanAppliedByDay[dayKey]) {
              const rec = d.nightOceanAppliedByDay[dayKey];
              if (rec.killedOcean === true && Number.isFinite(Number(rec.oceanIdx)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.oceanIdx, 10), { alive: true }); } catch {}
              }
              d.nightOceanAppliedByDay[dayKey] = { oceanIdx: null, targets: [], killedOcean: false, prevAlive: null };
            }
            // Professional shot
            if (d.nightProAppliedByDay && d.nightProAppliedByDay[dayKey]) {
              const rec = d.nightProAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              // Leon (pedarkhande): revert bullet consumption when reverting a night that had a Pro/Leon shot.
              if (getDrawScenarioForFlow() === "pedarkhande" && rec.target !== null) {
                d.leonShotsUsed = Math.max(0, (d.leonShotsUsed || 0) - 1);
              }
              if (rec.result === "vest_absorbed") d.godfatherVestUsed = false;
              d.nightProAppliedByDay[dayKey] = { killed: null, prevAlive: null, result: null, shooter: null, target: null };
            }
            // Sniper shot
            if (d.nightSniperAppliedByDay && d.nightSniperAppliedByDay[dayKey]) {
              const rec = d.nightSniperAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightSniperAppliedByDay[dayKey] = { killed: null, prevAlive: null, result: null, shooter: null, target: null };
              // Revert sniperShotUsed if this night had a shot
              if (rec.target !== null && rec.target !== undefined) {
                d.sniperShotUsed = false;
              }
            }
            // Once-per-game "used" flags set during the night being reverted.
            // Reporter
            if (d.reporterResultByNight && d.reporterResultByNight[dayKey]) {
              d.reporterResultByNight[dayKey] = null;
              d.reporterUsed = Object.values(d.reporterResultByNight).some((r) => r !== null && r !== undefined);
            }
            // NATO
            if (d.natoUsedNight != null && Number(d.natoUsedNight) === nightDayNum) {
              d.natoUsedNight = null;
            }
            // Minemaker
            if (d.minemakerUsedOnNight != null && Number(d.minemakerUsedOnNight) === nightDayNum) {
              d.minemakerUsed = false;
              d.minemakerUsedOnNight = null;
              d.minemakerMine = null;
            }
            // Lawyer
            if (d.lawyerUsedOnNight != null && Number(d.lawyerUsedOnNight) === nightDayNum) {
              d.lawyerUsed = false;
              d.lawyerUsedOnNight = null;
            }
            // Armorsmith self-armor
            if (d.armorsmithSelfUsedOnNight != null && Number(d.armorsmithSelfUsedOnNight) === nightDayNum) {
              d.armorsmithSelfUsed = false;
              d.armorsmithSelfUsedOnNight = null;
            }
            // Kabo Executioner kill
            if (d.nightExecutionerAppliedByDay && d.nightExecutionerAppliedByDay[dayKey]) {
              const eRec = d.nightExecutionerAppliedByDay[dayKey];
              if (eRec && Number.isFinite(Number(eRec.killed)) && eRec.prevAlive === true) {
                try { setPlayerLife(parseInt(eRec.killed, 10), { alive: true }); } catch {}
              }
              d.nightExecutionerAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Kabo Yakooza (revert role conversion)
            if (d.nightKaboYakoozaAppliedByDay && d.nightKaboYakoozaAppliedByDay[dayKey]) {
              const rec = d.nightKaboYakoozaAppliedByDay[dayKey];
              if (rec && Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const prevIdx = parseInt(rec.converted, 10);
                const prevP = appState.draw && appState.draw.players && appState.draw.players[prevIdx];
                if (prevP) prevP.roleId = rec.prevRoleId;
                d.kaboYakoozaUsed = false;
              }
              d.nightKaboYakoozaAppliedByDay[dayKey] = { converted: null, prevRoleId: null };
            }
            // Herbalist poison-kill (revive the killed player and reset the record)
            if (d.nightHerbalistAppliedByDay && d.nightHerbalistAppliedByDay[dayKey]) {
              const hRec = d.nightHerbalistAppliedByDay[dayKey];
              if (hRec) {
                if (Number.isFinite(Number(hRec.killed)) && hRec.prevAlive === true) {
                  try { setPlayerLife(parseInt(hRec.killed, 10), { alive: true }); } catch {}
                }
                d.herbalistCycleComplete = false;
                d.nightHerbalistAppliedByDay[dayKey] = { killed: null, prevAlive: null };
              }
            }
            // Don antidote used this night — revert
            if (d.danMafiaAntidoteUsedOnNight != null && Number(d.danMafiaAntidoteUsedOnNight) === nightDayNum) {
              d.danMafiaAntidoteUsed = false;
              d.danMafiaAntidoteUsedOnNight = null;
            }
            // Hard John first-survival flag
            if (d.hardJohnSurvivedOnNight != null && Number(d.hardJohnSurvivedOnNight) === nightDayNum) {
              d.hardJohnSurvivedMafiaShotOnce = false;
              d.hardJohnSurvivedOnNight = null;
            }
            // Leon vest (pedarkhande)
            if (d.leonVestUsedOnNight != null && Number(d.leonVestUsedOnNight) === nightDayNum) {
              d.leonVestUsed = false;
              d.leonVestUsedOnNight = null;
            }
            // Negotiator conversion
            if (d.nightNegotiatorAppliedByDay && d.nightNegotiatorAppliedByDay[dayKey]) {
              const rec = d.nightNegotiatorAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                if (p) p.roleId = rec.prevRoleId;
              }
              d.nightNegotiatorAppliedByDay[dayKey] = { converted: null, prevRoleId: null, succeeded: false };
            }
            // Investigator targets
            if (d.investigatorTargetsByNight) {
              d.investigatorTargetsByNight[dayKey] = null;
            }
            // Sodagari conversion + sacrifice
            if (d.nightSodagariAppliedByDay && d.nightSodagariAppliedByDay[dayKey]) {
              const rec = d.nightSodagariAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                if (p) p.roleId = rec.prevRoleId;
              }
              if (Number.isFinite(Number(rec.sacrifice)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.sacrifice, 10), { alive: true }); } catch {}
              }
              d.nightSodagariAppliedByDay[dayKey] = { converted: null, prevRoleId: null, sacrifice: null, prevAlive: null, succeeded: false };
            }
            if (d.sodagariUsedOnNight != null && Number(d.sodagariUsedOnNight) === nightDayNum) {
              d.sodagariUsed = false;
              d.sodagariUsedOnNight = null;
            }
            // Saul buy (pedarkhande) conversion revert
            if (d.nightSaulBuyAppliedByDay && d.nightSaulBuyAppliedByDay[dayKey]) {
              const rec = d.nightSaulBuyAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                if (p) p.roleId = rec.prevRoleId;
              }
              d.nightSaulBuyAppliedByDay[dayKey] = { converted: null, prevRoleId: null };
            }
            if (d.saulBuyUsedOnNight != null && Number(d.saulBuyUsedOnNight) === nightDayNum) {
              d.saulBuyUsed = false;
              d.saulBuyUsedOnNight = null;
            }
            if (d.kaneInvisibleBulletByNight != null && Number(d.kaneInvisibleBulletByNight) === nightDayNum) {
              const kaneIdx = appState.draw && appState.draw.players ? appState.draw.players.findIndex((p) => p && p.roleId === "citizenKane") : -1;
              if (kaneIdx !== -1) try { setPlayerLife(kaneIdx, { alive: true }); } catch {}
              d.kaneInvisibleBulletByNight = null;
            }
            // Kane ability (pedarkhande): once per game; refunded if marked player dies same night
            if (d.kaneAbilityUsedOnNight != null && Number(d.kaneAbilityUsedOnNight) === nightDayNum) {
              d.kaneAbilityUsed = false;
              d.kaneAbilityUsedOnNight = null;
            }
            // Soldier kills (namayande)
            if (d.nightSoldierAppliedByDay && d.nightSoldierAppliedByDay[dayKey]) {
              const rec = d.nightSoldierAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.soldierKilled)) && rec.soldierPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.soldierKilled, 10), { alive: true }); } catch {}
              }
              if (Number.isFinite(Number(rec.gunShotKilled)) && rec.gunShotPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.gunShotKilled, 10), { alive: true }); } catch {}
              }
              d.nightSoldierAppliedByDay[dayKey] = { soldierKilled: null, soldierPrevAlive: null, gunShotKilled: null, gunShotPrevAlive: null };
            }
            // Sixth Sense (pedarkhande)
            if (d.nightSixthSenseAppliedByDay && d.nightSixthSenseAppliedByDay[dayKey]) {
              const rec = d.nightSixthSenseAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
              }
              d.nightSixthSenseAppliedByDay[dayKey] = { killed: null, prevAlive: null };
            }
            // Constantine revive
            if (d.nightConstantineAppliedByDay && d.nightConstantineAppliedByDay[dayKey]) {
              const rec = d.nightConstantineAppliedByDay[dayKey];
              if (Number.isFinite(Number(rec.revived)) && rec.prevAlive === false) {
                try { setPlayerLife(parseInt(rec.revived, 10), { alive: false, reason: "eliminated" }); } catch {}
              }
              d.nightConstantineAppliedByDay[dayKey] = { revived: null, prevAlive: null };
            }
            // Heir inheritance (role change)
            if (d.heirInheritedByDay && d.heirInheritedByDay[dayKey]) {
              const rec = d.heirInheritedByDay[dayKey];
              if (Number.isFinite(Number(rec.heirIdx)) && rec.prevRole !== null) {
                const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.heirIdx, 10)];
                if (p) p.roleId = rec.prevRole;
              }
              d.heirInheritedByDay[dayKey] = { heirIdx: null, prevRole: null, newRole: null, pickedIdx: null };
            }
            // Neutralized shot once-per-game flag
            if (d.neutralizedShotUsedOnNight != null && Number(d.neutralizedShotUsedOnNight) === nightDayNum) {
              d.neutralizedShotUsed = false;
              d.neutralizedShotUsedOnNight = null;
            }
            // Joker used (array of night numbers)
            if (d.jokerUsed && Array.isArray(d.jokerUsed)) {
              d.jokerUsed = d.jokerUsed.filter((n) => Number(n) !== nightDayNum);
            }
            // Bomb planted that night (stored in bombByDay[nightDayNum+1])
            const nextDayKey = String(nightDayNum + 1);
            if (d.bombByDay && d.bombByDay[nextDayKey]) {
              const bomb = d.bombByDay[nextDayKey];
              if (bomb && Number(bomb.plantedNight) === nightDayNum) {
                delete d.bombByDay[nextDayKey];
              }
            }
            f.bombActive = false;
            // Natasha silence (Classic Pro / Meeting/Epic / Advanced)
            if (d.silencedByDay) {
              const natashaAffectedDay = String((nightDayNum || 1) + 1);
              if (d.silencedByDay[natashaAffectedDay]) delete d.silencedByDay[natashaAffectedDay];
            }
            // Sheriff reveal
            if (d.sheriffRevealByNight && d.sheriffRevealByNight[dayKey]) {
              d.sheriffRevealByNight[dayKey] = null;
            }
            // Freemason kills
            if (d.nightFreemasonAppliedByDay && d.nightFreemasonAppliedByDay[dayKey]) {
              const fRec = d.nightFreemasonAppliedByDay[dayKey];
              if (fRec && Number.isFinite(Number(fRec.freeKilled)) && fRec.freePrevAlive === true) {
                try { setPlayerLife(parseInt(fRec.freeKilled, 10), { alive: true }); } catch {}
              }
              if (fRec && Number.isFinite(Number(fRec.tgtKilled)) && fRec.tgtPrevAlive === true) {
                try { setPlayerLife(parseInt(fRec.tgtKilled, 10), { alive: true }); } catch {}
              }
              d.nightFreemasonAppliedByDay[dayKey] = { targetIdx: null, targetWasMafia: false, freeKilled: null, freePrevAlive: null, tgtKilled: null, tgtPrevAlive: null };
            }
            f.draft = d;
          } catch {}
        }

        // Returns true if any alive player has an unused real gun.
        function hasUnfiredRealGuns() {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players || !draw.players.length) return false;
            const f = (appState.god && appState.god.flow) ? appState.god.flow : null;
            const guns = (f && f.guns) ? f.guns : null;
            if (!guns || typeof guns !== "object") return false;
            for (const k of Object.keys(guns)) {
              const idx = parseInt(k, 10);
              if (!Number.isFinite(idx)) continue;
              const p = draw.players[idx];
              if (!p || p.alive === false) continue;
              const g = guns[idx];
              if (g && !g.used && g.type === "real") return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        // Kill all alive players who hold an unused real gun; track in draft.gunExpiryAppliedByDay.
        function applyGunExpiryForDay(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.gunExpiryAppliedByDay || typeof f.draft.gunExpiryAppliedByDay !== "object") f.draft.gunExpiryAppliedByDay = {};
            const guns = f.guns || {};
            const killed = [];
            for (const k of Object.keys(guns)) {
              const idx = parseInt(k, 10);
              if (!Number.isFinite(idx)) continue;
              const g = guns[idx];
              if (!g || g.used || g.type !== "real") continue;
              const p = draw.players[idx];
              if (!p || p.alive === false) continue;
              try { setPlayerLife(idx, { alive: false, reason: "gun_expiry" }); } catch {}
              killed.push({ idx, prevAlive: true });
            }
            f.draft.gunExpiryAppliedByDay[dayKey] = { killed };
            saveState(appState);
          } catch {}
        }

        // Revert deaths applied by applyGunExpiryForDay for the current day.
        function revertGunExpiryForDay(f) {
          try {
            const dayKey = String(f.day || 1);
            const d = f.draft || {};
            if (!d.gunExpiryAppliedByDay || !d.gunExpiryAppliedByDay[dayKey]) return;
            const rec = d.gunExpiryAppliedByDay[dayKey];
            for (const { idx, prevAlive } of (rec.killed || [])) {
              if (prevAlive) try { setPlayerLife(idx, { alive: true }); } catch {}
            }
            d.gunExpiryAppliedByDay[dayKey] = { killed: [] };
            f.draft = d;
          } catch {}
        }

        // Revert deaths applied when leaving day_guns step (gun shots).
        function revertGunShotsForDay(f) {
          try {
            const dayKey = String(f.day || 1);
            const d = f.draft || {};
            const rec = (d.gunShotAppliedByDay && d.gunShotAppliedByDay[dayKey]) || null;
            if (!rec || !rec.applied || !Array.isArray(rec.shots)) return;
            for (const shot of rec.shots) {
              if (shot.type === "real" && shot.targetPrevAlive) {
                try { setPlayerLife(shot.target, { alive: true }); } catch {}
              }
              if (Number.isFinite(Number(shot.chainKilled)) && shot.chainPrevAlive === true) {
                try { setPlayerLife(parseInt(shot.chainKilled, 10), { alive: true }); } catch {}
              }
              const shooter = parseInt(shot.shooter, 10);
              if (Number.isFinite(shooter) && f.guns && f.guns[shooter]) {
                f.guns[shooter].used = false;
              }
            }
            rec.applied = false;
            f.draft = d;
            if (Array.isArray(f.events)) {
              f.events = f.events.filter((e) => !(e && e.kind === "gun_shot" && e.phase === f.phase && Number(e.day) === Number(f.day)));
            }
          } catch {}
        }

        // Pedarkhande: when advancing from day_kane_reveal, host reveals the marked mafia's role.
        // The revealed player remains in the game (not eliminated). Kane dies at night by invisible bullet.
        function applyKaneRevealForDay(f) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return;
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const prevNightDay = (f.day || 1) - 1;
            const kaneEv = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNightDay && e.data);
            const kanePayload = kaneEv && kaneEv.data ? kaneEv.data : null;
            if (!kanePayload) return;
            const kaneMarkRaw = kanePayload.kaneMark;
            const kaneMarkIdx = (kaneMarkRaw !== null && kaneMarkRaw !== undefined && Number.isFinite(parseInt(kaneMarkRaw, 10))) ? parseInt(kaneMarkRaw, 10) : null;
            if (kaneMarkIdx === null) return;
            const markedPlayer = draw.players[kaneMarkIdx];
            if (!markedPlayer || markedPlayer.alive === false) return;
            const markedRid = markedPlayer.roleId || "citizen";
            const markedTeam = (roles[markedRid] && roles[markedRid].teamFa) ? roles[markedRid].teamFa : "شهر";
            if (markedTeam !== "مافیا") return;
            // Reveal only — marked player stays in game. Record for Status Check display.
            const d = f.draft || {};
            if (!d.kaneRevealAppliedByDay || typeof d.kaneRevealAppliedByDay !== "object") d.kaneRevealAppliedByDay = {};
            d.kaneRevealAppliedByDay[String(f.day)] = { idx: kaneMarkIdx, revealed: true };
            f.draft = d;
          } catch {}
        }

        function revertKaneRevealForDay(f) {
          try {
            const dayKey = String(f.day || 1);
            const d = f.draft || {};
            if (!d.kaneRevealAppliedByDay || !d.kaneRevealAppliedByDay[dayKey]) return;
            d.kaneRevealAppliedByDay[dayKey] = { idx: null, revealed: null };
            f.draft = d;
          } catch {}
        }

        // Apply end card action effects when advancing from day_end_card_* step.
        // Reversible via revertEndCardActionForDay.
        function applyEndCardActionForDay(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const d = f.draft || {};
            const dayKey = String(f.day || 1);
            const byDay = appState.god && appState.god.endCards && appState.god.endCards.byDay ? appState.god.endCards.byDay : {};
            const rec = byDay[dayKey] && typeof byDay[dayKey] === "object" ? byDay[dayKey] : null;
            if (!rec || !rec.cardId) return;
            const outIdx = (rec.out !== null && rec.out !== undefined && Number.isFinite(parseInt(rec.out, 10))) ? parseInt(rec.out, 10) : null;
            if (outIdx === null) return;
            const action = (d.endCardActionByDay && d.endCardActionByDay[dayKey]) || {};
            const cardId = String(rec.cardId || "");
            if (!d.endCardActionAppliedByDay || typeof d.endCardActionAppliedByDay !== "object") d.endCardActionAppliedByDay = {};
            const appliedRec = { cardId, out: outIdx, target: null, targets: [], prevState: null };
            if (cardId === "face_change" || cardId === "handcuffs" || cardId === "beautiful_mind") {
              const t = (action.target !== null && action.target !== undefined && Number.isFinite(parseInt(action.target, 10))) ? parseInt(action.target, 10) : null;
              if (t === null) return;
              appliedRec.target = t;
              const pOut = draw.players[outIdx];
              const pTgt = draw.players[t];
              if (!pOut || !pTgt) return;
              if (cardId === "face_change") {
                const prevOutRole = pOut.roleId || "citizen";
                const prevTgtRole = pTgt.roleId || "citizen";
                pOut.roleId = prevTgtRole;
                pTgt.roleId = prevOutRole;
                appliedRec.prevState = { outRole: prevOutRole, tgtRole: prevTgtRole };
              } else if (cardId === "handcuffs") {
                if (!d.handcuffedByDay || typeof d.handcuffedByDay !== "object") d.handcuffedByDay = {};
                d.handcuffedByDay[dayKey] = t;
              } else if (cardId === "beautiful_mind") {
                const isSelfPick = t === outIdx; // Nostradamus voted out and picks themselves
                const isNostradamus = isSelfPick || (pTgt.roleId || "") === "nostradamus";
                if (isNostradamus) {
                  const prevOutAlive = pOut.alive !== false;
                  const prevTgtAlive = pTgt.alive !== false;
                  const prevOutRole = pOut.roleId || "citizen";
                  const prevTgtRole = pTgt.roleId || "citizen";
                  const prevShieldBroken = !!d.nostradamusShieldBroken;
                  const bDayKey = String(f.day || 1);
                  const prevElim = f.draft.dayElimAppliedByDay && f.draft.dayElimAppliedByDay[bDayKey];
                  if (isSelfPick) {
                    // Nostradamus voted out, picks themselves: comes back alive but shield is destroyed.
                    try { setPlayerLife(outIdx, { alive: true }); } catch {}
                    d.nostradamusShieldBroken = true;
                    // Update day elim: nobody eliminated this day (Nostradamus survived the vote).
                    if (prevElim) {
                      f.draft.dayElimAppliedByDay[bDayKey] = {
                        out: null,
                        prevAlive: null,
                        chainOut: prevElim.chainOut || null,
                        chainPrevAlive: prevElim.chainPrevAlive || null,
                        armoredAbsorbed: prevElim.armoredAbsorbed || false,
                      };
                    }
                  } else {
                    // Correct guess of another player who is Nostradamus: kill them, revive guesser.
                    try { setPlayerLife(t, { alive: false, reason: "beautiful_mind" }); } catch {}
                    try { setPlayerLife(outIdx, { alive: true }); } catch {}
                    // Update day elim record: eliminated is now Nostradamus (t), not voted-out.
                    if (prevElim) {
                      f.draft.dayElimAppliedByDay[bDayKey] = {
                        out: t,
                        prevAlive: prevTgtAlive,
                        chainOut: prevElim.chainOut || null,
                        chainPrevAlive: prevElim.chainPrevAlive || null,
                        armoredAbsorbed: prevElim.armoredAbsorbed || false,
                      };
                    }
                  }
                  appliedRec.prevState = {
                    outAlive: prevOutAlive,
                    tgtAlive: prevTgtAlive,
                    outRole: prevOutRole,
                    tgtRole: prevTgtRole,
                    isSelfPick,
                    prevShieldBroken,
                    dayElimOut: outIdx,
                    dayElimPrevAlive: prevElim ? prevElim.prevAlive : true,
                    dayElimChainOut: prevElim ? prevElim.chainOut : null,
                    dayElimChainPrevAlive: prevElim ? prevElim.chainPrevAlive : null,
                    dayElimArmoredAbsorbed: prevElim ? prevElim.armoredAbsorbed : false,
                  };
                }
              }
            } else if (cardId === "silence_lambs") {
              const tgts = Array.isArray(action.targets) ? action.targets.map((x) => parseInt(x, 10)).filter((x) => Number.isFinite(x)) : [];
              if (tgts.length === 0) return;
              appliedRec.targets = tgts;
              // Silence affects the NEXT day (cannot defend when voted)
              const affectedDay = String((f.day || 1) + 1);
              appliedRec.silenceAffectedDay = affectedDay;
              if (!d.silencedByDay || typeof d.silencedByDay !== "object") d.silencedByDay = {};
              d.silencedByDay[affectedDay] = tgts;
            }
            d.endCardActionAppliedByDay[dayKey] = appliedRec;
            f.draft = d;
            // Only record event when we applied effects (Beautiful Mind wrong guess has nothing to show)
            const hasEffects = appliedRec.prevState != null || cardId === "handcuffs" || (cardId === "silence_lambs" && appliedRec.targets.length > 0);
            if (hasEffects) {
              addFlowEvent("end_card_action", {
                out: outIdx,
                cardId,
                target: appliedRec.target,
                targets: appliedRec.targets,
              });
            }
          } catch {}
        }

        function revertEndCardActionForDay(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return;
            const d = f.draft || {};
            const dayKey = String(f.day || 1);
            const rec = (d.endCardActionAppliedByDay && d.endCardActionAppliedByDay[dayKey]) || null;
            if (!rec) return;
            const cardId = String(rec.cardId || "");
            const outIdx = rec.out;
            const t = rec.target;
            const tgts = rec.targets || [];
            const prev = rec.prevState || {};
            if (cardId === "face_change" && prev.outRole != null && prev.tgtRole != null) {
              const pOut = draw.players[outIdx];
              const pTgt = draw.players[t];
              if (pOut) pOut.roleId = prev.outRole;
              if (pTgt) pTgt.roleId = prev.tgtRole;
            } else if (cardId === "handcuffs") {
              if (d.handcuffedByDay && d.handcuffedByDay[dayKey] != null) delete d.handcuffedByDay[dayKey];
            } else if (cardId === "beautiful_mind" && prev.outAlive != null && prev.tgtAlive != null) {
              if (prev.outAlive) try { setPlayerLife(outIdx, { alive: true }); } catch {}
              else try { setPlayerLife(outIdx, { alive: false }); } catch {}
              if (!prev.isSelfPick) {
                if (prev.tgtAlive) try { setPlayerLife(t, { alive: true }); } catch {}
                else try { setPlayerLife(t, { alive: false }); } catch {}
              }
              if (prev.outRole != null && prev.tgtRole != null) {
                const pOut = draw.players[outIdx];
                const pTgt = t != null && draw.players[t] ? draw.players[t] : null;
                if (pOut) pOut.roleId = prev.outRole;
                if (pTgt) pTgt.roleId = prev.tgtRole;
              }
              // Restore shield state.
              d.nostradamusShieldBroken = prev.prevShieldBroken || false;
              // Restore day elim record.
              if (prev.dayElimOut != null && prev.dayElimPrevAlive != null) {
                const dayKey = String(f.day || 1);
                if (d.dayElimAppliedByDay && d.dayElimAppliedByDay[dayKey]) {
                  d.dayElimAppliedByDay[dayKey] = {
                    out: prev.dayElimOut,
                    prevAlive: prev.dayElimPrevAlive,
                    chainOut: prev.dayElimChainOut ?? null,
                    chainPrevAlive: prev.dayElimChainPrevAlive ?? null,
                    armoredAbsorbed: prev.dayElimArmoredAbsorbed ?? false,
                  };
                }
              }
            } else if (cardId === "silence_lambs") {
              const affectedDay = rec.silenceAffectedDay || String((f.day || 1) + 1);
              if (d.silencedByDay && d.silencedByDay[affectedDay]) delete d.silencedByDay[affectedDay];
            }
            d.endCardActionAppliedByDay[dayKey] = null;
            f.draft = d;
            // Prune end_card_action event for this day
            if (Array.isArray(f.events)) {
              const idx = f.events.findIndex((ev) => ev && ev.kind === "end_card_action" && ev.phase === "day" && ev.day === f.day);
              if (idx >= 0) f.events.splice(idx, 1);
            }
          } catch {}
        }

        // ─────────────────────────────────────────────────────────────────────

        function addFlowEvent(kind, data) {
          const f = ensureFlow();
          const SNAPSHOT_KINDS = new Set(["day_vote", "day_elim", "night_actions", "bomb_toggle", "detective_query", "bomb_resolve"]);
          // For snapshot-like events, keep only the latest per (kind, phase, day).
          if (SNAPSHOT_KINDS.has(kind)) {
            try {
              if (Array.isArray(f.events) && f.events.length) {
                for (let i = f.events.length - 1; i >= 0; i--) {
                  const e = f.events[i];
                  if (!e) continue;
                  if (e.kind === kind && e.phase === f.phase && e.day === f.day) {
                    const steps = getFlowSteps(f);
                    const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
                    e.at = flowRecordTimestamp();
                    e.data = data || null;
                    e.stepIndex = (f.step != null) ? f.step : 0;
                    e.stepId = curStep.id || null;
                    saveState(appState);
                    return;
                  }
                }
              }
            } catch {}
          }
          // For idempotent-ish events, upsert by a stable key to avoid duplicates.
          // - gun_give: one record per recipient per night
          // - gun_shot: one record per shooter per day
          // - day_elim_draw: one record per day
          // - day_elim_out: one record per day (out can change when correcting)
          const canUpsert =
            kind === "gun_give" ||
            kind === "gun_shot" ||
            kind === "day_elim_draw" ||
            kind === "day_elim_out" ||
            kind === "end_card_action";
          if (canUpsert) {
            try {
              const match = (e) => {
                if (!e || e.kind !== kind || e.phase !== f.phase || e.day !== f.day) return false;
                const a = e.data || null;
                const b = data || null;
                if (kind === "gun_give") return a && b && a.to === b.to;
                if (kind === "gun_shot") return a && b && a.shooter === b.shooter;
                if (kind === "day_elim_draw") return true;
                if (kind === "day_elim_out") return true;
                if (kind === "end_card_action") return true;
                return false;
              };
              for (let i = (f.events || []).length - 1; i >= 0; i--) {
                const e = f.events[i];
                if (!match(e)) continue;
                const steps = getFlowSteps(f);
                const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
                e.at = flowRecordTimestamp();
                e.data = data || null;
                e.stepIndex = (f.step != null) ? f.step : 0;
                e.stepId = curStep.id || null;
                saveState(appState);
                return;
              }
            } catch {}
          }
          // Dedupe: avoid saving identical consecutive events (common during re-renders / repeated clicks).
          try {
            const now = Date.now();
            const last = (f.events && f.events.length) ? f.events[f.events.length - 1] : null;
            const a = (last && last.data !== undefined) ? last.data : null;
            const b = (data !== undefined) ? data : null;
            if (
              last &&
              last.kind === kind &&
              last.phase === f.phase &&
              last.day === f.day &&
              (now - flowRecordTimestampMs(last.at)) < 800 &&
              JSON.stringify(a) === JSON.stringify(b)
            ) {
              return;
            }
          } catch {}
          const steps = getFlowSteps(f);
          const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
          f.events.push({
            at: flowRecordTimestamp(),
            phase: f.phase,
            day: f.day,
            kind,
            data: data || null,
            stepIndex: (f.step != null) ? f.step : 0,
            stepId: curStep.id || null,
          });
          // keep event log bounded
          try {
            const MAX_EVENTS = 300;
            if (Array.isArray(f.events) && f.events.length > MAX_EVENTS) {
              f.events.splice(0, f.events.length - MAX_EVENTS);
            }
          } catch {}
          saveState(appState);
        }

        // Apply Mafia shot resolution immediately (with reversible preview).
        // Rule: if MafiaShot is set and DoctorSave is NOT the same target => target is out (shot).
        // If DoctorSave matches MafiaShot, the target stays alive.
        // Role immunities (from scenario/role descriptions): Zodiac, Invulnerable, Armored cannot be killed by mafia night shot.
        // Hard John survives the first mafia shot only.
        function applyNightMafiaFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightMafiaAppliedByDay || typeof f.draft.nightMafiaAppliedByDay !== "object") f.draft.nightMafiaAppliedByDay = {};
            const rec = (f.draft.nightMafiaAppliedByDay[dayKey] && typeof f.draft.nightMafiaAppliedByDay[dayKey] === "object")
              ? f.draft.nightMafiaAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };

            const ms = (payload.mafiaShot === null || payload.mafiaShot === undefined) ? null : parseInt(payload.mafiaShot, 10);
            const ds = (payload.doctorSave === null || payload.doctorSave === undefined) ? null : parseInt(payload.doctorSave, 10);
            const ls = (payload.lecterSave === null || payload.lecterSave === undefined) ? null : parseInt(payload.lecterSave, 10);
            const scenarioMafia = getDrawScenarioForFlow();
            const isDevil = String(scenarioMafia || "").toLowerCase() === "devil";
            let effectiveDoctorSave = ds;
            if (isDevil) {
              const monkIdx = findAliveDevilRole("devilMonk");
              if (monkIdx !== null && devilIsPoisonedThisNight(payload, monkIdx)) effectiveDoctorSave = null;
            }

            // NATO rule: if NATO made a role guess this night, mafia cannot shoot.
            // If the guess was correct, NATO's target dies instead.
            const natoTgt = (payload.natoTarget === null || payload.natoTarget === undefined) ? null : parseInt(payload.natoTarget, 10);
            const natoGuess = (payload.natoRoleGuess != null && String(payload.natoRoleGuess).trim()) ? String(payload.natoRoleGuess).trim() : null;
            const natoMadeGuess = Number.isFinite(natoTgt) && natoTgt >= 0 && natoTgt < draw.players.length && natoGuess !== null;

            let desiredKill = (Number.isFinite(ms) && ms >= 0 && ms < draw.players.length && ms !== effectiveDoctorSave && ms !== ls) ? ms : null;
            if (isDevil) {
              const impIdx = findAliveDevilRole("devilImp");
              if (impIdx !== null && devilIsPoisonedThisNight(payload, impIdx)) desiredKill = null;
            }
            // Armorsmith armor: if target received armor this night, shot is blocked.
            const armorTgt = (payload.armorsmithArmor !== null && payload.armorsmithArmor !== undefined && Number.isFinite(Number(payload.armorsmithArmor)))
              ? parseInt(payload.armorsmithArmor, 10) : null;
            if (desiredKill !== null && armorTgt !== null && desiredKill === armorTgt) desiredKill = null;
            // Pedarkhande: no mafia shot when Godfather chose sixth sense or Saul buy (if Saul buy fails, no shot either).
            // Kabo: no mafia shot when Don chose yakooza or guess_role.
            const godfatherAction = (payload.godfatherAction != null && String(payload.godfatherAction)) ? String(payload.godfatherAction) : "shoot";
            if (scenarioMafia === "pedarkhande" && (godfatherAction === "sixth_sense" || godfatherAction === "saul_buy")) desiredKill = null;
            if (scenarioMafia === "kabo" && (godfatherAction === "yakooza" || godfatherAction === "guess_role")) desiredKill = null;
            // NATO blocks the mafia shot entirely when a guess was made.
            if (natoMadeGuess) desiredKill = null;

            // If NATO's guess was correct, kill that target (subject to same immunities as mafia shot).
            if (natoMadeGuess && natoTgt !== effectiveDoctorSave && natoTgt !== ls) {
              const actualRole = (draw.players[natoTgt] && draw.players[natoTgt].roleId) ? draw.players[natoTgt].roleId : "citizen";
              if (natoGuess === actualRole) desiredKill = natoTgt;
            }

            if (desiredKill !== null) {
              const targetRole = (draw.players[desiredKill] && draw.players[desiredKill].roleId) ? draw.players[desiredKill].roleId : "citizen";
              if (isDevil && targetRole === "devilSoldier" && !devilIsPoisonedThisNight(payload, desiredKill)) {
                desiredKill = null;
              } else if (!isDevil && (targetRole === "zodiac" || targetRole === "invulnerable")) {
                desiredKill = null;
              } else if (targetRole === "heir") {
                // Heir is immune only when they picked a citizen and that successor is still alive.
                // If Heir picked mafia, nothing special — Heir plays as simple citizen (no immunity).
                const heirPick = (() => {
                  if (!f.draft.nightActionsByNight) return null;
                  for (const nk of Object.keys(f.draft.nightActionsByNight)) {
                    const na = f.draft.nightActionsByNight[nk];
                    if (na && na.heirPick !== null && na.heirPick !== undefined) {
                      const idx = parseInt(na.heirPick, 10);
                      if (Number.isFinite(idx)) return idx;
                    }
                  }
                  return null;
                })();
                const pickedRole = heirPick != null && draw.players[heirPick] ? (draw.players[heirPick].roleId || "citizen") : null;
                const pickedIsMafia = pickedRole && (roles[pickedRole] && roles[pickedRole].teamFa === "مافیا");
                const pickedAlive = heirPick != null && draw.players[heirPick] && draw.players[heirPick].alive !== false;
                if (heirPick != null && !pickedIsMafia && pickedAlive) desiredKill = null;
              } else if (targetRole === "armored" && !f.draft.armoredVoteUsed) {
                // Armored is immune to night shots until their armor has been spent by a vote-out.
                desiredKill = null;
              } else if (targetRole === "hardJohn") {
                if (!f.draft.hardJohnSurvivedMafiaShotOnce) {
                  f.draft.hardJohnSurvivedMafiaShotOnce = true;
                  f.draft.hardJohnSurvivedOnNight = f.day || 1;
                  desiredKill = null;
                }
              } else if (targetRole === "leon" && scenarioMafia === "pedarkhande") {
                if (!f.draft.leonVestUsed) {
                  f.draft.leonVestUsed = true;
                  f.draft.leonVestUsedOnNight = f.day || 1;
                  desiredKill = null;
                }
              } else if (targetRole === "nostradamus" && scenarioMafia === "pedarkhande") {
                // Nostradamus has unlimited shields — unless broken by Beautiful Mind self-pick.
                if (!f.draft.nostradamusShieldBroken) desiredKill = null;
              }
            }

            const devilImpSelfKill = !!(isDevil && desiredKill !== null && getFlowRoleId(desiredKill) === "devilImp");
            const devilImpSuccessor = devilImpSelfKill
              ? findAliveDevilMinion(payload.botcImpSuccessor, desiredKill)
              : null;

            // no change
            const recHasDevilPromotion = Number.isFinite(Number(rec.impPassedTo)) || Number.isFinite(Number(rec.devilPromoted));
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null && !recHasDevilPromotion) return false;
            if (
              Number.isFinite(Number(rec.killed)) &&
              desiredKill !== null &&
              parseInt(rec.killed, 10) === desiredKill &&
              (!isDevil || !devilImpSelfKill || parseInt(rec.impPassedTo, 10) === devilImpSuccessor)
            ) return false;

            // revert previous applied kill (only if we killed someone who was alive before)
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }
            // revert previous researcher chain kill
            if (Number.isFinite(Number(rec.chainKilled)) && rec.chainPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.chainKilled, 10), { alive: true }); } catch {}
            }
            try { revertDevilPromotionRecord(f, rec, dayKey); } catch {}
            rec.chainKilled = null;
            rec.chainPrevAlive = null;

            // apply new kill
            if (desiredKill !== null) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;

              if (devilImpSelfKill && devilImpSuccessor !== null) {
                try { promoteDevilPlayerToImp(f, rec, devilImpSuccessor, "imp_self_kill"); } catch {}
              }

              // Researcher chain kill: if mafia killed the Researcher, also kill their linked player.
              try {
                if ((draw.players[desiredKill] || {}).roleId === "researcher") {
                  // Prefer payload.researcherLink (always present in night_actions event data),
                  // fall back to nightActionsByNight for older saves.
                  const linkedIdxRaw = (payload.researcherLink !== null && payload.researcherLink !== undefined)
                    ? payload.researcherLink
                    : (() => {
                        const na = f.draft.nightActionsByNight && f.draft.nightActionsByNight[dayKey];
                        return na ? na.researcherLink : null;
                      })();
                  const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                  if (linkedIdx !== null && draw.players[linkedIdx]) {
                    const linkedRoleId = draw.players[linkedIdx].roleId || "citizen";
                    const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                    const scenario = getDrawScenarioForFlow();
                    const chainApplies = scenario === "bazras"
                      ? (linkedRoleId === "nato" || linkedRoleId === "swindler")
                      : (linkedTeamFa === "مافیا" && linkedRoleId !== "mafiaBoss");
                    if (chainApplies) {
                      const chainWasAlive = draw.players[linkedIdx].alive !== false;
                      if (chainWasAlive) {
                        try { setPlayerLife(linkedIdx, { alive: false, reason: "researcher_chain" }); } catch {}
                      }
                      rec.chainKilled = linkedIdx;
                      rec.chainPrevAlive = chainWasAlive;
                    }
                  }
                }
              } catch {}
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }

            f.draft.nightMafiaAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Pedarkhande: Sixth Sense — if Godfather guessed correctly, target is eliminated at dawn (end of that night).
        function applyNightSixthSenseFromPayload(f, payload) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return false;
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const godfatherAction = (payload.godfatherAction != null) ? String(payload.godfatherAction) : "shoot";
            if (godfatherAction !== "sixth_sense") return false;
            const targetRaw = payload.sixthSenseTarget;
            const targetIdx = (targetRaw !== null && targetRaw !== undefined && Number.isFinite(parseInt(targetRaw, 10))) ? parseInt(targetRaw, 10) : null;
            if (targetIdx === null) return false;
            const guessedRole = (payload.sixthSenseRole != null && String(payload.sixthSenseRole).trim()) ? String(payload.sixthSenseRole).trim() : null;
            if (!guessedRole) return false;
            const targetPlayer = draw.players[targetIdx];
            if (!targetPlayer || targetPlayer.alive === false) return false;
            const actualRole = targetPlayer.roleId || "citizen";
            const correct = (guessedRole === actualRole) ||
              (guessedRole === "citizen" && actualRole === "nostradamus") ||
              (guessedRole === "mafia" && actualRole === "citizenKane");
            if (!correct) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSixthSenseAppliedByDay || typeof f.draft.nightSixthSenseAppliedByDay !== "object") f.draft.nightSixthSenseAppliedByDay = {};
            const rec = (f.draft.nightSixthSenseAppliedByDay[dayKey] && typeof f.draft.nightSixthSenseAppliedByDay[dayKey] === "object")
              ? f.draft.nightSixthSenseAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };
            if (rec.killed !== null) return false;
            const prevAlive = targetPlayer.alive !== false;
            setPlayerLife(targetIdx, { alive: false, reason: "sixth_sense" });
            f.draft.nightSixthSenseAppliedByDay[dayKey] = { killed: targetIdx, prevAlive };
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Zodiac shot resolution immediately (with reversible preview).
        // Rule: if Zodiac shot is set, the target dies (including Mafia).
        // Exception: when Zodiac shoots the Guard, the Zodiac dies instead (Guard survives).
        function applyNightZodiacFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightZodiacAppliedByDay || typeof f.draft.nightZodiacAppliedByDay !== "object") f.draft.nightZodiacAppliedByDay = {};
            const rec = (f.draft.nightZodiacAppliedByDay[dayKey] && typeof f.draft.nightZodiacAppliedByDay[dayKey] === "object")
              ? f.draft.nightZodiacAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };

            const zs = (payload.zodiacShot === null || payload.zodiacShot === undefined) ? null : parseInt(payload.zodiacShot, 10);
            const targetIdx = (Number.isFinite(zs) && zs >= 0 && zs < draw.players.length) ? zs : null;
            let desiredKill = null;
            if (targetIdx !== null) {
              const targetRole = (draw.players[targetIdx] && draw.players[targetIdx].roleId) ? draw.players[targetIdx].roleId : "citizen";
              if (targetRole === "guard") {
                const zodiacIdx = (() => {
                  for (let i = 0; i < draw.players.length; i++) {
                    if (draw.players[i] && draw.players[i].roleId === "zodiac") return i;
                  }
                  return null;
                })();
                desiredKill = zodiacIdx;
              } else {
                desiredKill = targetIdx;
              }
            }

            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill) return false;

            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            if (desiredKill !== null) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }

            f.draft.nightZodiacAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Ocean wake resolution immediately (with reversible preview).
        // Rule (as requested): if Ocean wakes Mafia or Zodiac => Ocean is out.
        // If Ocean wakes a Citizen => no one dies (and they can chat for ~20s).
        function applyNightOceanFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightOceanAppliedByDay || typeof f.draft.nightOceanAppliedByDay !== "object") f.draft.nightOceanAppliedByDay = {};
            const rec = (f.draft.nightOceanAppliedByDay[dayKey] && typeof f.draft.nightOceanAppliedByDay[dayKey] === "object")
              ? f.draft.nightOceanAppliedByDay[dayKey]
              : { oceanIdx: null, targets: [], killedOcean: false, prevAlive: null };

            const oceanIdx = (() => {
              try {
                for (let i = 0; i < draw.players.length; i++) {
                  const p = draw.players[i];
                  if (p && p.roleId === "ocean") return i;
                }
              } catch {}
              return null;
            })();

            const targets = (() => {
              try {
                const v = payload.oceanWake;
                const arr = Array.isArray(v) ? v : (v === null || v === undefined ? [] : [v]);
                const out = arr
                  .map((x) => parseInt(x, 10))
                  .filter((x) => Number.isFinite(x) && x >= 0 && x < draw.players.length);
                // unique + stable order
                return Array.from(new Set(out)).sort((a, b) => a - b);
              } catch {
                return [];
              }
            })();

            const isBadPick = (() => {
              try {
                for (const target of targets) {
                  const targetRole = (draw.players[target] && draw.players[target].roleId) ? draw.players[target].roleId : "citizen";
                  const teamFa = (roles[targetRole] && roles[targetRole].teamFa) ? roles[targetRole].teamFa : "شهر";
                  if (teamFa === "مافیا" || targetRole === "zodiac") return true;
                }
                return false;
              } catch {
                return false;
              }
            })();
            const desiredKillOcean = !!(oceanIdx !== null && isBadPick);

            // no change
            const sameTargets = (() => {
              try {
                const a = Array.isArray(rec.targets) ? rec.targets.slice().sort((x, y) => x - y) : [];
                if (a.length !== targets.length) return false;
                for (let i = 0; i < a.length; i++) if (a[i] !== targets[i]) return false;
                return true;
              } catch {
                return false;
              }
            })();
            if ((rec.killedOcean === false || rec.killedOcean === null || rec.killedOcean === undefined) && desiredKillOcean === false && sameTargets) return false;
            if (rec.killedOcean === true && desiredKillOcean === true && sameTargets) return false;

            // revert previous applied ocean death (only if ocean was alive before)
            if (rec.killedOcean === true && Number.isFinite(Number(rec.oceanIdx))) {
              const prevOceanIdx = parseInt(rec.oceanIdx, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevOceanIdx, { alive: true }); } catch {}
              }
            }

            // apply new ocean death if needed
            if (desiredKillOcean === true && Number.isFinite(Number(oceanIdx))) {
              const oi = parseInt(oceanIdx, 10);
              const op = draw.players[oi];
              const wasAlive = op ? (op.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(oi, { alive: false, reason: "ocean" }); } catch {}
              }
              rec.oceanIdx = oi;
              rec.targets = targets;
              rec.killedOcean = true;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.oceanIdx = oceanIdx;
              rec.targets = targets;
              rec.killedOcean = false;
              rec.prevAlive = null;
            }

            f.draft.nightOceanAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Professional shot resolution immediately (with reversible preview).
        // Rule: if Professional shoots Mafia => target is out.
        // If shoots Zodiac => no effect.
        // If shoots a non-mafia (citizen/independent) => Professional is out.
        function applyNightProfessionalFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightProAppliedByDay || typeof f.draft.nightProAppliedByDay !== "object") f.draft.nightProAppliedByDay = {};
            const rec = (f.draft.nightProAppliedByDay[dayKey] && typeof f.draft.nightProAppliedByDay[dayKey] === "object")
              ? f.draft.nightProAppliedByDay[dayKey]
              : { killed: null, prevAlive: null, result: null, shooter: null, target: null };

            const proIdx = (function () {
              try {
                for (let i = 0; i < draw.players.length; i++) {
                  const p = draw.players[i];
                  if (p && (p.roleId === "professional" || p.roleId === "leon") && p.alive !== false) return i;
                }
              } catch {}
              return null;
            })();

            let tIdxRaw = (payload.professionalShot === null || payload.professionalShot === undefined) ? null : parseInt(payload.professionalShot, 10);
            let tIdx = (Number.isFinite(tIdxRaw) && tIdxRaw >= 0 && tIdxRaw < draw.players.length) ? tIdxRaw : null;
            // Pedarkhande: Leon has only 2 bullets per game
            const scenarioPro = getDrawScenarioForFlow();
            if (scenarioPro === "pedarkhande" && proIdx !== null && draw.players[proIdx] && draw.players[proIdx].roleId === "leon") {
              const d = f.draft || {};
              const used = (d.leonShotsUsed != null && Number.isFinite(Number(d.leonShotsUsed))) ? Number(d.leonShotsUsed) : 0;
              if (used >= 2 && tIdx !== null) tIdx = null;
            }

            const desired = (() => {
              try {
                if (proIdx === null || tIdx === null) return { killIdx: null, result: null, shooter: proIdx, target: tIdx };
                const tr = (draw.players[tIdx] && draw.players[tIdx].roleId) ? draw.players[tIdx].roleId : "citizen";
                const teamFa = (roles[tr] && roles[tr].teamFa) ? roles[tr].teamFa : "شهر";
                if (tr === "zodiac") return { killIdx: null, result: "no_effect", shooter: proIdx, target: tIdx };
                // Pedarkhande: Nostradamus — shot from opposite side affects them. Leon (city) vs Nostradamus who chose Mafia = Nostradamus dies.
                if (scenarioPro === "pedarkhande" && tr === "nostradamus") {
                  const nostSide = (f.draft && (f.draft.nostradamusChosenSide === "mafia" || f.draft.nostradamusChosenSide === "citizen")) ? f.draft.nostradamusChosenSide : null;
                  if (nostSide === "mafia") return { killIdx: tIdx, result: "killed_mafia", shooter: proIdx, target: tIdx };
                  if (nostSide === "citizen") return { killIdx: proIdx, result: "killed_self", shooter: proIdx, target: tIdx };
                }
                // Pedarkhande: Godfather has one vest — immune to Leon's first shot.
                if (scenarioPro === "pedarkhande" && (tr === "godfather" || tr === "mafiaBoss") && proIdx !== null && draw.players[proIdx] && draw.players[proIdx].roleId === "leon") {
                  const vestUsed = !!(f.draft && f.draft.godfatherVestUsed);
                  if (!vestUsed) return { killIdx: null, result: "vest_absorbed", shooter: proIdx, target: tIdx };
                }
                if (teamFa === "مافیا") return { killIdx: tIdx, result: "killed_mafia", shooter: proIdx, target: tIdx };
                return { killIdx: proIdx, result: "killed_self", shooter: proIdx, target: tIdx };
              } catch {
                return { killIdx: null, result: null, shooter: proIdx, target: tIdx };
              }
            })();

            const desiredKill = desired.killIdx;
            const desiredResult = desired.result;

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null && rec.result === desiredResult && rec.target === desired.target) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill && rec.result === desiredResult && rec.target === desired.target) return false;

            // revert previous applied kill (only if that player was alive before)
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            // apply new kill
            if (desiredKill !== null && Number.isFinite(Number(desiredKill))) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }
            rec.result = desiredResult;
            rec.shooter = desired.shooter;
            rec.target = desired.target;

            f.draft.nightProAppliedByDay[dayKey] = rec;
            if (desiredResult === "vest_absorbed") {
              if (!f.draft.godfatherVestUsed) f.draft.godfatherVestUsed = true;
            }
            if ((desiredKill !== null || desiredResult === "vest_absorbed") && scenarioPro === "pedarkhande" && proIdx !== null && draw.players[proIdx] && draw.players[proIdx].roleId === "leon") {
              if (!f.draft.leonShotsUsed || typeof f.draft.leonShotsUsed !== "number") f.draft.leonShotsUsed = 0;
              f.draft.leonShotsUsed += 1;
            }

            // log (upsert via snapshot night_actions already; this is a dedicated event)
            try {
              if (desiredResult === "killed_mafia" || desiredResult === "killed_self" || desiredResult === "vest_absorbed") {
                addFlowEvent("pro_shot", { shooter: desired.shooter, target: desired.target, result: desiredResult });
              }
            } catch {}

            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Sniper shot resolution immediately (with reversible preview).
        // Rule: if Sniper shoots Mafia => target dies (city doctor save can protect target but sniper lives).
        //       if Sniper shoots a non-mafia => Sniper dies (regardless of doctor save).
        //       Sniper has one shot total — tracked via d.sniperShotUsed.
        function applyNightSniperFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSniperAppliedByDay || typeof f.draft.nightSniperAppliedByDay !== "object") f.draft.nightSniperAppliedByDay = {};
            const rec = (f.draft.nightSniperAppliedByDay[dayKey] && typeof f.draft.nightSniperAppliedByDay[dayKey] === "object")
              ? f.draft.nightSniperAppliedByDay[dayKey]
              : { killed: null, prevAlive: null, result: null, shooter: null, target: null };

            const sniperIdx = (function () {
              try {
                for (let i = 0; i < draw.players.length; i++) {
                  const p = draw.players[i];
                  if (p && p.roleId === "sniper" && p.alive !== false) return i;
                }
              } catch {}
              return null;
            })();

            const tIdxRaw = (payload.sniperShot === null || payload.sniperShot === undefined) ? null : parseInt(payload.sniperShot, 10);
            const tIdx = (Number.isFinite(tIdxRaw) && tIdxRaw >= 0 && tIdxRaw < draw.players.length) ? tIdxRaw : null;

            const desired = (() => {
              try {
                if (sniperIdx === null || tIdx === null) return { killIdx: null, result: null, shooter: sniperIdx, target: tIdx };
                const tr = (draw.players[tIdx] && draw.players[tIdx].roleId) ? draw.players[tIdx].roleId : "citizen";
                const teamFa = (roles[tr] && roles[tr].teamFa) ? roles[tr].teamFa : "شهر";
                if (tr === "zodiac") return { killIdx: null, result: "no_effect", shooter: sniperIdx, target: tIdx };
                // bazras special rule: shooting mafiaBoss kills nobody
                if (tr === "mafiaBoss" && getDrawScenarioForFlow() === "bazras") return { killIdx: null, result: "no_effect_boss", shooter: sniperIdx, target: tIdx };
                if (teamFa === "مافیا") return { killIdx: tIdx, result: "killed_mafia", shooter: sniperIdx, target: tIdx };
                // Shot a citizen/independent → sniper dies
                return { killIdx: sniperIdx, result: "killed_self", shooter: sniperIdx, target: tIdx };
              } catch {
                return { killIdx: null, result: null, shooter: sniperIdx, target: tIdx };
              }
            })();

            const desiredKill = desired.killIdx;
            const desiredResult = desired.result;

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null && rec.result === desiredResult && rec.target === desired.target) return false;
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill && rec.result === desiredResult && rec.target === desired.target) return false;

            // revert previous applied kill
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            // apply new kill
            if (desiredKill !== null && Number.isFinite(Number(desiredKill))) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "shot" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive === true;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }
            rec.result = desiredResult;
            rec.shooter = desired.shooter;
            rec.target = desired.target;

            f.draft.nightSniperAppliedByDay[dayKey] = rec;

            // Mark shot as used (once per game)
            if (tIdx !== null) {
              f.draft.sniperShotUsed = true;
            }

            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Constantine revive immediately (with reversible preview).
        // Rule: Constantine can revive one previously-eliminated player per game.
        // If the moderator changes or clears the selection within the same night, the previous revival is undone.
        function applyNightConstantineFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightConstantineAppliedByDay || typeof f.draft.nightConstantineAppliedByDay !== "object") f.draft.nightConstantineAppliedByDay = {};
            const rec = (f.draft.nightConstantineAppliedByDay[dayKey] && typeof f.draft.nightConstantineAppliedByDay[dayKey] === "object")
              ? f.draft.nightConstantineAppliedByDay[dayKey]
              : { revived: null, prevAlive: null };

            const cr = (payload.constantineRevive === null || payload.constantineRevive === undefined) ? null : parseInt(payload.constantineRevive, 10);
            let desiredRevive = (Number.isFinite(cr) && cr >= 0 && cr < draw.players.length) ? cr : null;
            // Executioner (Kabo) kill is unconditional — Constantine cannot revive executioner victims.
            if (desiredRevive !== null) {
              const execRec = (f.draft.nightExecutionerAppliedByDay && f.draft.nightExecutionerAppliedByDay[dayKey]) ? f.draft.nightExecutionerAppliedByDay[dayKey] : null;
              if (execRec && execRec.killed !== null && execRec.killed !== undefined && parseInt(execRec.killed, 10) === desiredRevive) desiredRevive = null;
            }
            // Once per game: if Constantine already revived someone in a previous night, block.
            if (desiredRevive !== null) {
              const nc = f.draft.nightConstantineAppliedByDay || {};
              for (const dk of Object.keys(nc)) {
                if (dk === dayKey) continue;
                const r = nc[dk];
                if (r && r.revived != null && Number.isFinite(parseInt(r.revived, 10))) {
                  desiredRevive = null;
                  break;
                }
              }
            }

            // no change
            if ((rec.revived === null || rec.revived === undefined) && desiredRevive === null) return false;
            if (Number.isFinite(Number(rec.revived)) && desiredRevive !== null && parseInt(rec.revived, 10) === desiredRevive) return false;

            // revert previous revival (set player dead again if they were dead before)
            if (Number.isFinite(Number(rec.revived))) {
              const prevIdx = parseInt(rec.revived, 10);
              if (rec.prevAlive === false) {
                try { setPlayerLife(prevIdx, { alive: false, reason: "eliminated" }); } catch {}
              }
            }

            // apply new revival
            if (desiredRevive !== null) {
              const p = draw.players[desiredRevive];
              const wasAlive = p ? (p.alive !== false) : false;
              if (!wasAlive) {
                try { setPlayerLife(desiredRevive, { alive: true }); } catch {}
              }
              rec.revived = desiredRevive;
              rec.prevAlive = wasAlive;
            } else {
              rec.revived = null;
              rec.prevAlive = null;
            }

            f.draft.nightConstantineAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Herbalist poison-kill (with reversible preview).
        // Rule: Herbalist poisons on Night X. Victim stays alive. At Night X+1: group votes on antidote, Herbalist decides.
        // At dawn of Day X+2 (Night X+1 resolution): if no antidote given → poisoned player dies.
        // Herbalist has one poison + one antidote total per game (tracked via d.herbalistCycleComplete).
        function applyNightHerbalistFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            const d = f.draft;
            if (!d.nightHerbalistAppliedByDay || typeof d.nightHerbalistAppliedByDay !== "object") d.nightHerbalistAppliedByDay = {};
            const rec = (d.nightHerbalistAppliedByDay[dayKey] && typeof d.nightHerbalistAppliedByDay[dayKey] === "object")
              ? d.nightHerbalistAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };

            // Night 1: poison applied, victim does NOT die. Night 2+: check previous night's poison + antidote decision.
            const prevActions = (d.nightActionsByNight && d.nightActionsByNight[prevNightKey]) ? d.nightActionsByNight[prevNightKey] : null;
            let prevPoisonRaw = (prevActions ? prevActions.herbalistPoison : null) ?? (prevNightKey === dayKey ? payload.herbalistPoison : null);
            // Witch (Kabo): when herbalist is bewitched, herbalist poisons self — override applies regardless of herbalist's pick.
            if (getDrawScenarioForFlow() === "kabo" && prevActions && prevActions.witchTarget != null && Number.isFinite(Number(prevActions.witchTarget))) {
              const wt = parseInt(prevActions.witchTarget, 10);
              const tgt = (draw.players && draw.players[wt]) || null;
              if (tgt && tgt.roleId === "herbalist") prevPoisonRaw = wt;
            }
            const prevPoison = (prevPoisonRaw !== null && prevPoisonRaw !== undefined && Number.isFinite(parseInt(prevPoisonRaw, 10)))
              ? parseInt(prevPoisonRaw, 10) : null;

            // Night 1: no kill (poison deferred to Night 2 resolution).
            if (parseInt(dayKey, 10) <= 1) return false;

            // No active poison from previous night — nothing to kill.
            if (prevPoison === null) return false;

            // Antidote check: herbalistAntidoteDecision from Night 2 (or payload) — Herbalist's final call.
            // Don (danMafia) has one antidote: when poisoned, he can use it (no Herbalist decision needed).
            // If Don was killed by Capo gun on Day 1, his antidote transfers to Witch.
            const haRaw = (payload.herbalistAntidoteDecision !== null && payload.herbalistAntidoteDecision !== undefined)
              ? payload.herbalistAntidoteDecision
              : payload.herbalistAntidote;
            let antidoteGiven = (haRaw !== null && haRaw !== undefined &&
              Number.isFinite(parseInt(haRaw, 10)) && parseInt(haRaw, 10) === prevPoison);
            const prevPoisonRole = (draw.players[prevPoison] && draw.players[prevPoison].roleId) ? draw.players[prevPoison].roleId : "citizen";
            if (!antidoteGiven && prevPoisonRole === "danMafia" && !d.danMafiaAntidoteUsed) {
              antidoteGiven = true;
              d.danMafiaAntidoteUsed = true;
              d.danMafiaAntidoteUsedOnNight = f.day || 1;
              f.draft = d;
            }
            if (!antidoteGiven && prevPoisonRole === "witch" && d.witchHasAntidoteFromDon) {
              antidoteGiven = true;
              d.witchHasAntidoteFromDon = false;
              f.draft = d;
            }
            const desiredKill = antidoteGiven ? null : prevPoison;

            // no change
            if ((rec.killed === null || rec.killed === undefined) && desiredKill === null) {
              // Cycle complete (antidote given) — mark abilities used.
              d.herbalistCycleComplete = true;
              f.draft = d;
              saveState(appState);
              return false;
            }
            if (Number.isFinite(Number(rec.killed)) && desiredKill !== null && parseInt(rec.killed, 10) === desiredKill) return false;

            // revert previous kill
            if (Number.isFinite(Number(rec.killed))) {
              const prevIdx = parseInt(rec.killed, 10);
              if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
            }

            // apply new kill
            if (desiredKill !== null) {
              const p = draw.players[desiredKill];
              const wasAlive = p ? (p.alive !== false) : false;
              if (wasAlive) {
                try { setPlayerLife(desiredKill, { alive: false, reason: "poison" }); } catch {}
              }
              rec.killed = desiredKill;
              rec.prevAlive = wasAlive;
            } else {
              rec.killed = null;
              rec.prevAlive = null;
            }

            // Mark cycle complete (both poison and antidote decision used).
            d.herbalistCycleComplete = true;
            d.nightHerbalistAppliedByDay[dayKey] = rec;
            f.draft = d;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Negotiator role-conversion immediately (with reversible preview).
        // Succeeds only when target is a plain citizen (roleId === "citizen")
        // or an armored player who still has armor (!f.draft.armoredVoteUsed).
        // On success the target's roleId becomes "mafia". Reversible via back-nav.
        function applyNightNegotiatorFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightNegotiatorAppliedByDay || typeof f.draft.nightNegotiatorAppliedByDay !== "object") f.draft.nightNegotiatorAppliedByDay = {};
            const rec = (f.draft.nightNegotiatorAppliedByDay[dayKey] && typeof f.draft.nightNegotiatorAppliedByDay[dayKey] === "object")
              ? f.draft.nightNegotiatorAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null, succeeded: false };

            const ntRaw = (payload.negotiatorTarget === null || payload.negotiatorTarget === undefined) ? null : parseInt(payload.negotiatorTarget, 10);
            const desiredTarget = (Number.isFinite(ntRaw) && ntRaw >= 0 && ntRaw < draw.players.length) ? ntRaw : null;

            // no change
            if ((rec.converted === null || rec.converted === undefined) && desiredTarget === null) return false;
            if (Number.isFinite(Number(rec.converted)) && desiredTarget !== null && parseInt(rec.converted, 10) === desiredTarget) return false;

            // revert previous conversion
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const p = draw.players[prevIdx];
              if (p) p.roleId = rec.prevRoleId;
            }
            rec.converted = null;
            rec.prevRoleId = null;
            rec.succeeded = false;

            // apply new conversion
            if (desiredTarget !== null) {
              const p = draw.players[desiredTarget];
              const targetRole = (p && p.roleId) ? p.roleId : "citizen";
              const isEligible = (targetRole === "citizen") ||
                (targetRole === "armored" && !f.draft.armoredVoteUsed);
              if (isEligible && p) {
                rec.prevRoleId = targetRole;
                p.roleId = "mafia";
                rec.converted = desiredTarget;
                rec.succeeded = true;
              } else {
                // target not eligible — record attempt but don't convert
                rec.converted = desiredTarget;
                rec.prevRoleId = null;
                rec.succeeded = false;
              }
            }

            f.draft.nightNegotiatorAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Saul buy (pedarkhande): Godfather chose "Saul buy"; once per game, convert one simple citizen to mafia.
        // Only allowed when at least one mafia is dead. Only simple citizen (roleId === "citizen") can be bought;
        // if target is not simple citizen, buy fails and mafia cannot shoot tonight (handled in applyNightMafiaFromPayload).
        function applyNightSaulBuyFromPayload(f, payload) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande" || !f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const godfatherAction = (payload.godfatherAction != null && String(payload.godfatherAction)) ? String(payload.godfatherAction) : "shoot";
            if (godfatherAction !== "saul_buy") return false;
            const sbRaw = (payload.saulBuyTarget === null || payload.saulBuyTarget === undefined) ? null : parseInt(payload.saulBuyTarget, 10);
            const desiredTarget = (Number.isFinite(sbRaw) && sbRaw >= 0 && sbRaw < draw.players.length) ? sbRaw : null;
            if (desiredTarget === null) return false;
            const d = f.draft || {};
            const mafiaCount = (draw.players || []).filter((p) => p && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const mafiaAliveCount = (draw.players || []).filter((p) => p && p.alive !== false && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const atLeastOneMafiaDead = mafiaCount > 0 && mafiaAliveCount < mafiaCount;
            if (!atLeastOneMafiaDead) return false;
            const p = draw.players[desiredTarget];
            const targetRole = (p && p.roleId) ? p.roleId : "citizen";
            if (targetRole !== "citizen") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSaulBuyAppliedByDay || typeof f.draft.nightSaulBuyAppliedByDay !== "object") f.draft.nightSaulBuyAppliedByDay = {};
            const rec = (f.draft.nightSaulBuyAppliedByDay[dayKey] && typeof f.draft.nightSaulBuyAppliedByDay[dayKey] === "object")
              ? f.draft.nightSaulBuyAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null };
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const prevP = draw.players[prevIdx];
              if (prevP) prevP.roleId = rec.prevRoleId;
            }
            rec.converted = desiredTarget;
            rec.prevRoleId = "citizen";
            p.roleId = "mafia";
            f.draft.nightSaulBuyAppliedByDay[dayKey] = rec;
            f.draft.saulBuyUsed = true;
            f.draft.saulBuyUsedOnNight = Number(dayKey);
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        /** Returns indices of players that can be shown as Matador disable targets.
         * Excludes the player disabled last night (cannot disable same twice in a row).
         * Returns [] when Matador is dead. Used by flow-ui and tests. */
        function getMatadorDisableTargetIndices(f) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return [];
            const draw = appState.draw;
            if (!draw || !draw.players) return [];
            const matadorIdx = (draw.players || []).findIndex((p) => p && p.roleId === "matador");
            if (matadorIdx < 0 || !draw.players[matadorIdx] || draw.players[matadorIdx].alive === false) return [];
            const d = (f && f.draft) ? f.draft : {};
            const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
            const prevNight = (d.nightActionsByNight && d.nightActionsByNight[prevNightKey]) ? d.nightActionsByNight[prevNightKey] : null;
            const prevMatadorIdx = (prevNight && prevNight.matadorDisable != null && Number.isFinite(Number(prevNight.matadorDisable))) ? parseInt(prevNight.matadorDisable, 10) : null;
            const excludeSet = prevMatadorIdx !== null ? new Set([prevMatadorIdx]) : new Set();
            return (draw.players || []).map((p, i) => {
              if (!p || p.alive === false) return null;
              return excludeSet.has(i) ? null : i;
            }).filter((x) => x !== null);
          } catch {
            return [];
          }
        }

        // Kabo Yakooza: Mafia Don buys a simple citizen; converts to mafia. Once per game when at least one mafia dead.
        function applyNightKaboYakoozaFromPayload(f, payload) {
          try {
            if (getDrawScenarioForFlow() !== "kabo" || !f || !payload) return false;
            const godfatherAction = (payload.godfatherAction != null && String(payload.godfatherAction)) ? String(payload.godfatherAction) : "shoot";
            if (godfatherAction !== "yakooza") return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const yRaw = (payload.kaboYakoozaTarget === null || payload.kaboYakoozaTarget === undefined) ? null : parseInt(payload.kaboYakoozaTarget, 10);
            const desiredTarget = (Number.isFinite(yRaw) && yRaw >= 0 && yRaw < draw.players.length) ? yRaw : null;
            if (desiredTarget === null) return false;
            const d = f.draft || {};
            const mafiaCount = (draw.players || []).filter((p) => p && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const mafiaAliveCount = (draw.players || []).filter((p) => p && p.alive !== false && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const atLeastOneMafiaDead = mafiaCount > 0 && mafiaAliveCount < mafiaCount;
            if (!atLeastOneMafiaDead || d.kaboYakoozaUsed) return false;
            const p = draw.players[desiredTarget];
            const targetRole = (p && p.roleId) ? p.roleId : "citizen";
            if (targetRole !== "citizen" && targetRole !== "suspect") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightKaboYakoozaAppliedByDay || typeof f.draft.nightKaboYakoozaAppliedByDay !== "object") f.draft.nightKaboYakoozaAppliedByDay = {};
            const rec = (f.draft.nightKaboYakoozaAppliedByDay[dayKey] && typeof f.draft.nightKaboYakoozaAppliedByDay[dayKey] === "object")
              ? f.draft.nightKaboYakoozaAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null };
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const prevP = draw.players[prevIdx];
              if (prevP) prevP.roleId = rec.prevRoleId;
            }
            rec.converted = desiredTarget;
            rec.prevRoleId = targetRole;
            p.roleId = "mafia";
            f.draft.nightKaboYakoozaAppliedByDay[dayKey] = rec;
            f.draft.kaboYakoozaUsed = true;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Kabo Executioner: guess a player's role; if correct, target is eliminated unconditionally.
        // This kill bypasses all saves (armorsmith, doctor, Constantine, etc.) — no one can prevent it.
        function applyNightExecutionerFromPayload(f, payload) {
          try {
            if (getDrawScenarioForFlow() !== "kabo" || !f || !payload) return false;
            const godfatherAction = (payload.godfatherAction != null && String(payload.godfatherAction)) ? String(payload.godfatherAction) : "shoot";
            if (godfatherAction !== "guess_role") return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const tRaw = (payload.executionerTarget === null || payload.executionerTarget === undefined) ? null : parseInt(payload.executionerTarget, 10);
            const targetIdx = (Number.isFinite(tRaw) && tRaw >= 0 && tRaw < draw.players.length) ? tRaw : null;
            if (targetIdx === null) return false;
            const guessedRole = (payload.executionerRoleGuess != null && String(payload.executionerRoleGuess).trim()) ? String(payload.executionerRoleGuess).trim() : null;
            if (!guessedRole) return false;
            const targetPlayer = draw.players[targetIdx];
            if (!targetPlayer || targetPlayer.alive === false) return false;
            const actualRole = targetPlayer.roleId || "citizen";
            const correct = guessedRole === actualRole;
            if (!correct) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightExecutionerAppliedByDay || typeof f.draft.nightExecutionerAppliedByDay !== "object") f.draft.nightExecutionerAppliedByDay = {};
            const rec = (f.draft.nightExecutionerAppliedByDay[dayKey] && typeof f.draft.nightExecutionerAppliedByDay[dayKey] === "object")
              ? f.draft.nightExecutionerAppliedByDay[dayKey]
              : { killed: null, prevAlive: null };
            if (Number.isFinite(Number(rec.killed)) && rec.prevAlive === true) {
              try { setPlayerLife(parseInt(rec.killed, 10), { alive: true }); } catch {}
            }
            const wasAlive = targetPlayer.alive !== false;
            try { setPlayerLife(targetIdx, { alive: false, reason: "executioner" }); } catch {}
            f.draft.nightExecutionerAppliedByDay[dayKey] = { killed: targetIdx, prevAlive: wasAlive };
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        /** Returns indices of players that can be shown as Saul Buy targets (all alive non-mafia).
         * Moderator sees all options; only simple citizen succeeds. Used by flow-ui and tests. */
        function getSaulBuyTargetIndices(f) {
          try {
            if (getDrawScenarioForFlow() !== "pedarkhande") return [];
            const draw = appState.draw;
            if (!draw || !draw.players) return [];
            const d = (f && f.draft) ? f.draft : {};
            const saulBuyUsed = !!(d.saulBuyUsed);
            const mafiaCount = (draw.players || []).filter((p) => p && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const mafiaAliveCount = (draw.players || []).filter((p) => p && p.alive !== false && (roles[p.roleId || "citizen"] && roles[p.roleId || "citizen"].teamFa === "مافیا")).length;
            const atLeastOneMafiaDead = mafiaCount > 0 && mafiaAliveCount < mafiaCount;
            if (saulBuyUsed || !atLeastOneMafiaDead) return [];
            return (draw.players || []).map((p, i) => {
              if (!p || p.alive === false) return null;
              const rid = p.roleId || "citizen";
              const team = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
              return team === "مافیا" ? null : i;
            }).filter((x) => x !== null);
          } catch {
            return [];
          }
        }

        // Store investigator's two nightly targets (bazras scenario).
        // No kills here — just records for status display.
        function applyNightInvestigatorFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.investigatorTargetsByNight || typeof f.draft.investigatorTargetsByNight !== "object") f.draft.investigatorTargetsByNight = {};
            const t1Raw = (payload.investigatorT1 === null || payload.investigatorT1 === undefined) ? null : parseInt(payload.investigatorT1, 10);
            const t2Raw = (payload.investigatorT2 === null || payload.investigatorT2 === undefined) ? null : parseInt(payload.investigatorT2, 10);
            const t1 = (Number.isFinite(t1Raw) && t1Raw >= 0 && t1Raw < draw.players.length) ? t1Raw : null;
            const t2 = (Number.isFinite(t2Raw) && t2Raw >= 0 && t2Raw < draw.players.length) ? t2Raw : null;
            if (t1 === null && t2 === null) {
              f.draft.investigatorTargetsByNight[dayKey] = null;
              return false;
            }
            f.draft.investigatorTargetsByNight[dayKey] = { t1, t2 };
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Bazras interrogation forced-vote elimination.
        // payload: { decision: "continue"|"cancel"|null, outcome: idx|"tie"|null }
        // Passing null as payload reverts any current elimination (used when going backward).
        function applyBazrasInterrogationFromPayload(f, payload) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            const d = f.draft;
            const dayKey = String(f.day || 1);
            if (!d.bazrasInterrogationByDay || typeof d.bazrasInterrogationByDay !== "object") d.bazrasInterrogationByDay = {};
            const rec = (d.bazrasInterrogationByDay[dayKey] && typeof d.bazrasInterrogationByDay[dayKey] === "object")
              ? d.bazrasInterrogationByDay[dayKey]
              : { decision: null, outcome: null, prevEliminated: null, prevAlive: null };
            const newDecision = payload ? (payload.decision || null) : null;
            const newOutcome = payload ? (payload.outcome !== undefined ? payload.outcome : null) : null;
            // no change
            if (rec.decision === newDecision && rec.outcome === newOutcome) return false;
            // revert previous elimination
            if (Number.isFinite(Number(rec.prevEliminated))) {
              if (rec.prevAlive === true) {
                try { setPlayerLife(parseInt(rec.prevEliminated, 10), { alive: true }); } catch {}
              }
            }
            rec.prevEliminated = null;
            rec.prevAlive = null;
            rec.decision = newDecision;
            rec.outcome = newOutcome;
            // apply new elimination
            if (newDecision === "continue" && newOutcome !== null && newOutcome !== "tie" && Number.isFinite(Number(newOutcome))) {
              const idx = parseInt(newOutcome, 10);
              const p = draw.players[idx];
              const wasAlive = p ? (p.alive !== false) : null;
              if (wasAlive) {
                try { setPlayerLife(idx, { alive: false, reason: "vote" }); } catch {}
              }
              rec.prevEliminated = idx;
              rec.prevAlive = wasAlive === true;
            }
            d.bazrasInterrogationByDay[dayKey] = rec;
            f.draft = d;
            saveState(appState);
            return true;
          } catch { return false; }
        }

        // Apply sodagari (bazras mafiaBoss trade): converts an eligible citizen/invulnerable to mafia
        // and eliminates the mafia-member sacrifice. Reversible via back-nav.
        function applyNightSodagariFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const scenario = getDrawScenarioForFlow();
            if (scenario !== "bazras") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSodagariAppliedByDay || typeof f.draft.nightSodagariAppliedByDay !== "object") f.draft.nightSodagariAppliedByDay = {};
            const rec = (f.draft.nightSodagariAppliedByDay[dayKey] && typeof f.draft.nightSodagariAppliedByDay[dayKey] === "object")
              ? f.draft.nightSodagariAppliedByDay[dayKey]
              : { converted: null, prevRoleId: null, sacrifice: null, prevAlive: null, succeeded: false };

            const sacRaw = (payload.sodagariSacrifice === null || payload.sodagariSacrifice === undefined) ? null : parseInt(payload.sodagariSacrifice, 10);
            const tgtRaw = (payload.sodagariTarget === null || payload.sodagariTarget === undefined) ? null : parseInt(payload.sodagariTarget, 10);
            const desiredSac = (Number.isFinite(sacRaw) && sacRaw >= 0 && sacRaw < draw.players.length) ? sacRaw : null;
            const desiredTgt = (Number.isFinite(tgtRaw) && tgtRaw >= 0 && tgtRaw < draw.players.length) ? tgtRaw : null;

            // no change
            if (rec.sacrifice === desiredSac && rec.converted === desiredTgt) return false;

            // revert previous conversion
            if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
              const prevIdx = parseInt(rec.converted, 10);
              const p = draw.players[prevIdx];
              if (p) p.roleId = rec.prevRoleId;
            }
            // revert previous sacrifice kill
            if (Number.isFinite(Number(rec.sacrifice)) && rec.prevAlive === true) {
              const prevSacIdx = parseInt(rec.sacrifice, 10);
              try { setPlayerLife(prevSacIdx, { alive: true }); } catch {}
            }
            rec.converted = null; rec.prevRoleId = null; rec.sacrifice = null; rec.prevAlive = null; rec.succeeded = false;

            if (desiredSac !== null || desiredTgt !== null) {
              // Apply sacrifice elimination
              if (desiredSac !== null) {
                const sp = draw.players[desiredSac];
                rec.sacrifice = desiredSac;
                rec.prevAlive = (sp && sp.alive !== false) ? true : false;
                if (sp && sp.alive !== false) {
                  try { setPlayerLife(desiredSac, { alive: false }); } catch {}
                }
              }
              // Apply conversion
              if (desiredTgt !== null) {
                const tp = draw.players[desiredTgt];
                const targetRole = (tp && tp.roleId) ? tp.roleId : "citizen";
                const isEligible = (targetRole === "citizen") || (targetRole === "invulnerable");
                if (isEligible && tp) {
                  rec.prevRoleId = targetRole;
                  tp.roleId = "mafia";
                  rec.converted = desiredTgt;
                  rec.succeeded = true;
                } else {
                  rec.converted = desiredTgt;
                  rec.prevRoleId = null;
                  rec.succeeded = false;
                }
              }
              f.draft.sodagariUsed = true;
            }

            f.draft.nightSodagariAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Soldier night bullet: if given to mafia → soldier dies;
        // if given to citizen and citizen fired → apply gun-shot kill rule.
        function applyNightSoldierFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            if (getDrawScenarioForFlow() !== "namayande") return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightSoldierAppliedByDay || typeof f.draft.nightSoldierAppliedByDay !== "object") f.draft.nightSoldierAppliedByDay = {};
            const rec = (f.draft.nightSoldierAppliedByDay[dayKey] && typeof f.draft.nightSoldierAppliedByDay[dayKey] === "object")
              ? f.draft.nightSoldierAppliedByDay[dayKey]
              : { soldierKilled: null, soldierPrevAlive: null, gunShotKilled: null, gunShotPrevAlive: null };

            const tgtRaw = (payload.soldierTarget === null || payload.soldierTarget === undefined) ? null : parseInt(payload.soldierTarget, 10);
            const gsRaw = (payload.soldierGunShot === null || payload.soldierGunShot === undefined) ? null : parseInt(payload.soldierGunShot, 10);
            const desiredTgt = (Number.isFinite(tgtRaw) && tgtRaw >= 0 && tgtRaw < draw.players.length) ? tgtRaw : null;
            const desiredGs = (Number.isFinite(gsRaw) && gsRaw >= 0 && gsRaw < draw.players.length) ? gsRaw : null;

            // no change
            if (rec.soldierTgt === desiredTgt && rec.gunShotTgt === desiredGs) return false;

            // revert previous kills
            if (Number.isFinite(Number(rec.soldierKilled)) && rec.soldierPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.soldierKilled, 10), { alive: true }); } catch {}
            }
            if (Number.isFinite(Number(rec.gunShotKilled)) && rec.gunShotPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.gunShotKilled, 10), { alive: true }); } catch {}
            }
            rec.soldierKilled = null; rec.soldierPrevAlive = null;
            rec.gunShotKilled = null; rec.gunShotPrevAlive = null;
            rec.soldierTgt = desiredTgt; rec.gunShotTgt = desiredGs;

            if (desiredTgt !== null) {
              const tp = draw.players[desiredTgt];
              const tgtRoleId = (tp && tp.roleId) ? tp.roleId : "citizen";
              const tgtTeamFa = (roles[tgtRoleId] && roles[tgtRoleId].teamFa) ? roles[tgtRoleId].teamFa : "شهر";
              if (tgtTeamFa === "مافیا") {
                // bullet given to mafia → soldier dies
                const soldierIdx = (() => {
                  for (let i = 0; i < draw.players.length; i++) {
                    if (draw.players[i] && draw.players[i].roleId === "soldier" && draw.players[i].alive !== false) return i;
                  }
                  return null;
                })();
                if (soldierIdx !== null) {
                  const wasAlive = draw.players[soldierIdx].alive !== false;
                  if (wasAlive) { try { setPlayerLife(soldierIdx, { alive: false, reason: "soldier_gave_mafia" }); } catch {} }
                  rec.soldierKilled = soldierIdx;
                  rec.soldierPrevAlive = wasAlive;
                }
              } else if (desiredGs !== null) {
                // bullet given to citizen; citizen shot
                const gsp = draw.players[desiredGs];
                const gsRoleId = (gsp && gsp.roleId) ? gsp.roleId : "citizen";
                const gsTeamFa = (roles[gsRoleId] && roles[gsRoleId].teamFa) ? roles[gsRoleId].teamFa : "شهر";
                if (gsRoleId === "don") {
                  // shot at Don → nobody dies
                } else if (gsTeamFa === "مافیا") {
                  // shot at mafia → mafia dies
                  const wasAlive = gsp ? gsp.alive !== false : false;
                  if (wasAlive) { try { setPlayerLife(desiredGs, { alive: false, reason: "soldier_gun_shot" }); } catch {} }
                  rec.gunShotKilled = desiredGs;
                  rec.gunShotPrevAlive = wasAlive;
                } else {
                  // shot at citizen → recipient (bullet holder = desiredTgt) dies
                  const rp = draw.players[desiredTgt];
                  const wasAlive = rp ? rp.alive !== false : false;
                  if (wasAlive) { try { setPlayerLife(desiredTgt, { alive: false, reason: "soldier_gun_citizen" }); } catch {} }
                  rec.gunShotKilled = desiredTgt;
                  rec.gunShotPrevAlive = wasAlive;
                }
              }
            }

            f.draft.nightSoldierAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply day elimination (vote-out) immediately (with reversible preview).
        function applyDayElimFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const dayKey = String(f.day || 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.dayElimAppliedByDay || typeof f.draft.dayElimAppliedByDay !== "object") f.draft.dayElimAppliedByDay = {};
            const rec = (f.draft.dayElimAppliedByDay[dayKey] && typeof f.draft.dayElimAppliedByDay[dayKey] === "object")
              ? f.draft.dayElimAppliedByDay[dayKey]
              : { out: null, prevAlive: null };

            const desiredOutRaw = (payload.out === null || payload.out === undefined) ? null : parseInt(payload.out, 10);
            const desiredOut = (Number.isFinite(desiredOutRaw) && desiredOutRaw >= 0 && desiredOutRaw < draw.players.length) ? desiredOutRaw : null;
            const desiredNoExecution = isDevilScenario() && desiredOut === null && payload.noExecution === true;

            // no change
            const recHasDevilExtras = !!(rec.devilNoExecution || rec.devilSaintExecuted || Number.isFinite(Number(rec.devilPromoted)));
            if ((rec.out === null || rec.out === undefined) && desiredOut === null && !desiredNoExecution && !recHasDevilExtras) return false;
            if (Number.isFinite(Number(rec.out)) && desiredOut !== null && parseInt(rec.out, 10) === desiredOut && !recHasDevilExtras) return false;

            // revert previous applied out
            if (Number.isFinite(Number(rec.out))) {
              const prevIdx = parseInt(rec.out, 10);
              const prevWasDon = (draw.players[prevIdx] && draw.players[prevIdx].roleId === "danMafia");
              if (rec.armoredAbsorbed) {
                // Armor absorbed the vote — just clear the used flag on revert
                f.draft.armoredVoteUsed = false;
              } else if (rec.prevAlive === true) {
                try { setPlayerLife(prevIdx, { alive: true }); } catch {}
              }
              // Kabo: revert Don→Witch antidote transfer when reverting kabo_shoot (Day 1 elim = kabo_shoot)
              if (prevWasDon && desiredOut === null && (f.day || 1) === 1 && f.draft.witchHasAntidoteFromDon) {
                f.draft.witchHasAntidoteFromDon = false;
              }
            }
            try { revertDevilPromotionRecord(f, rec, dayKey); } catch {}
            if (rec.devilSaintExecuted && f.draft.devilSaintExecutedByDay) {
              delete f.draft.devilSaintExecutedByDay[dayKey];
            }
            if (rec.devilNoExecution && f.draft.devilNoExecutionByDay) {
              delete f.draft.devilNoExecutionByDay[dayKey];
            }
            // revert previous researcher chain kill
            if (Number.isFinite(Number(rec.chainOut))) {
              if (rec.chainPrevAlive === true) {
                try { setPlayerLife(parseInt(rec.chainOut, 10), { alive: true }); } catch {}
              }
            }
            rec.chainOut = null;
            rec.chainPrevAlive = null;
            rec.armoredAbsorbed = false;
            rec.devilSaintExecuted = false;
            rec.devilNoExecution = false;

            // apply new out
            if (desiredOut !== null) {
              const p = draw.players[desiredOut];
              const wasAlive = p ? (p.alive !== false) : null;
              const isArmored = (p && p.roleId === "armored");
              const armorAbsorbs = isArmored && !f.draft.armoredVoteUsed;
              const devilAliveBefore = isDevilScenario() ? devilAliveCount() : 0;
              const devilVictimRole = p && p.roleId ? p.roleId : "citizen";

              if (armorAbsorbs) {
                // Armored survives the first vote-out; armor is now spent.
                f.draft.armoredVoteUsed = true;
                rec.armoredAbsorbed = true;
                rec.out = desiredOut;
                rec.prevAlive = null;
              } else {
                if (wasAlive) {
                  try { setPlayerLife(desiredOut, { alive: false, reason: "vote" }); } catch {}
                }
                rec.armoredAbsorbed = false;
                rec.out = desiredOut;
                rec.prevAlive = wasAlive === true;

                if (isDevilScenario()) {
                  if (!f.draft.devilSaintExecutedByDay || typeof f.draft.devilSaintExecutedByDay !== "object") f.draft.devilSaintExecutedByDay = {};
                  if (!f.draft.devilNoExecutionByDay || typeof f.draft.devilNoExecutionByDay !== "object") f.draft.devilNoExecutionByDay = {};
                  if (devilVictimRole === "devilSaint") {
                    f.draft.devilSaintExecutedByDay[dayKey] = true;
                    rec.devilSaintExecuted = true;
                  }
                  if (devilVictimRole === "devilImp" && wasAlive && devilAliveBefore >= 5) {
                    promoteDevilScarletWoman(f, rec, "scarlet_woman");
                  }
                }

                // Kabo: if Don killed by Capo gun on Day 1, his antidote transfers to Witch.
                if (getDrawScenarioForFlow() === "kabo" && payload.kaboShot && (f.day || 1) === 1) {
                  const victimRole = (draw.players[desiredOut] && draw.players[desiredOut].roleId) ? draw.players[desiredOut].roleId : "citizen";
                  if (victimRole === "danMafia") {
                    f.draft.witchHasAntidoteFromDon = true;
                  }
                }

                // researcher chain kill: if voted-out player is Researcher linked to eligible role
                try {
                  if ((draw.players[desiredOut] || {}).roleId === "researcher") {
                    const prevNightKey = String((f.day || 1) - 1);
                    const prevNightActions = (f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) || null;
                    const linkedIdxRaw = prevNightActions ? prevNightActions.researcherLink : null;
                    const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                    if (linkedIdx !== null && draw.players[linkedIdx]) {
                      const linkedRoleId = draw.players[linkedIdx].roleId || "citizen";
                      const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                      const scenario = getDrawScenarioForFlow();
                      const chainApplies = scenario === "bazras"
                        ? (linkedRoleId === "nato" || linkedRoleId === "swindler")
                        : (linkedTeamFa === "مافیا" && linkedRoleId !== "mafiaBoss");
                      if (chainApplies) {
                        const chainWasAlive = draw.players[linkedIdx].alive !== false;
                        if (chainWasAlive) {
                          try { setPlayerLife(linkedIdx, { alive: false, reason: "researcher_chain" }); } catch {}
                        }
                        rec.chainOut = linkedIdx;
                        rec.chainPrevAlive = chainWasAlive;
                      }
                    }
                  }
                } catch {}
              }
            } else {
              rec.out = null;
              rec.prevAlive = null;
              if (desiredNoExecution) {
                if (!f.draft.devilNoExecutionByDay || typeof f.draft.devilNoExecutionByDay !== "object") f.draft.devilNoExecutionByDay = {};
                f.draft.devilNoExecutionByDay[dayKey] = true;
                rec.devilNoExecution = true;
              }
            }

            f.draft.dayElimAppliedByDay[dayKey] = rec;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        function getDevilStepInput(f, stepId, key, fallback) {
          try {
            const el = (typeof document !== "undefined") ? document.getElementById(key) : null;
            if (el) return (el.type === "checkbox" || el.type === "radio") ? !!el.checked : el.value;
            const d = f && f.draft ? f.draft : {};
            const saved = d.stepInputs && d.stepInputs[stepId] ? d.stepInputs[stepId] : {};
            if (Object.prototype.hasOwnProperty.call(saved, key)) return saved[key];
            return fallback;
          } catch {
            return fallback;
          }
        }

        function revertDevilDayActionsForDay(f, dayNum) {
          try {
            if (!f || !f.draft || !f.draft.devilDayActionsAppliedByDay) return false;
            const dayKey = String(dayNum || f.day || 1);
            const rec = f.draft.devilDayActionsAppliedByDay[dayKey];
            if (!rec) return false;
            if (Number.isFinite(Number(rec.virginKilled)) && rec.virginPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.virginKilled, 10), { alive: true }); } catch {}
            }
            if (Number.isFinite(Number(rec.slayerKilled)) && rec.slayerPrevAlive === true) {
              try { setPlayerLife(parseInt(rec.slayerKilled, 10), { alive: true }); } catch {}
            }
            try { revertDevilPromotionRecord(f, rec, dayKey); } catch {}
            if (rec.virginUsedSet && Number(f.draft.devilVirginUsedOnDay) === Number(dayKey)) {
              f.draft.devilVirginUsed = false;
              f.draft.devilVirginUsedOnDay = null;
            }
            if (rec.slayerUsedSet && Number(f.draft.devilSlayerUsedOnDay) === Number(dayKey)) {
              f.draft.devilSlayerUsed = false;
              f.draft.devilSlayerUsedOnDay = null;
            }
            f.draft.devilDayActionsAppliedByDay[dayKey] = null;
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        function applyDevilDayActionsFromInputs(f) {
          try {
            if (!isDevilScenario()) return false;
            const draw = appState.draw;
            if (!f || !draw || !draw.players) return false;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.devilDayActionsAppliedByDay || typeof f.draft.devilDayActionsAppliedByDay !== "object") f.draft.devilDayActionsAppliedByDay = {};
            const dayKey = String(f.day || 1);
            revertDevilDayActionsForDay(f, dayKey);

            const rec = {
              virginKilled: null,
              virginPrevAlive: null,
              virginUsedSet: false,
              slayerKilled: null,
              slayerPrevAlive: null,
              slayerUsedSet: false,
              devilPromoted: null,
              devilPromotedPrevRoleId: null,
              devilPromotionReason: null,
            };

            const virginApply = getDevilStepInput(f, "devil_day_actions", "fl_devil_virgin_first", false) === true;
            const virginNominator = parseFlowPlayerIndex(getDevilStepInput(f, "devil_day_actions", "fl_devil_virgin_nominator", null), draw.players);
            const virginIdx = findAliveDevilRole("devilVirgin");
            if (virginApply && virginIdx !== null && virginNominator !== null && !f.draft.devilVirginUsed) {
              f.draft.devilVirginUsed = true;
              f.draft.devilVirginUsedOnDay = f.day || 1;
              rec.virginUsedSet = true;
              const nominator = draw.players[virginNominator];
              const nominatorRole = nominator && nominator.roleId ? nominator.roleId : "citizen";
              const virginPoisoned = devilIsPoisonedOnDay(f, virginIdx);
              const aliveBefore = devilAliveCount();
              if (!virginPoisoned && nominator && nominator.alive !== false && isDevilRoleType(nominatorRole, "townsfolk")) {
                const wasAlive = nominator.alive !== false;
                if (wasAlive) {
                  try { setPlayerLife(virginNominator, { alive: false, reason: "virgin" }); } catch {}
                }
                rec.virginKilled = virginNominator;
                rec.virginPrevAlive = wasAlive === true;
                if (nominatorRole === "devilImp" && aliveBefore >= 5) {
                  promoteDevilScarletWoman(f, rec, "scarlet_woman");
                }
              }
            }

            const slayerFire = getDevilStepInput(f, "devil_day_actions", "fl_devil_slayer_fire", false) === true;
            const slayerTarget = parseFlowPlayerIndex(getDevilStepInput(f, "devil_day_actions", "fl_devil_slayer_target", null), draw.players);
            const slayerIdx = findAliveDevilRole("devilSlayer");
            if (slayerFire && slayerIdx !== null && slayerTarget !== null && !f.draft.devilSlayerUsed) {
              f.draft.devilSlayerUsed = true;
              f.draft.devilSlayerUsedOnDay = f.day || 1;
              rec.slayerUsedSet = true;
              const slayerPoisoned = devilIsPoisonedOnDay(f, slayerIdx);
              const target = draw.players[slayerTarget];
              const targetRole = target && target.roleId ? target.roleId : "citizen";
              const aliveBefore = devilAliveCount();
              if (!slayerPoisoned && target && target.alive !== false && targetRole === "devilImp") {
                const wasAlive = target.alive !== false;
                if (wasAlive) {
                  try { setPlayerLife(slayerTarget, { alive: false, reason: "slayer" }); } catch {}
                }
                rec.slayerKilled = slayerTarget;
                rec.slayerPrevAlive = wasAlive === true;
                if (aliveBefore >= 5) {
                  promoteDevilScarletWoman(f, rec, "scarlet_woman");
                }
              }
            }

            const applied = rec.virginUsedSet || rec.slayerUsedSet || Number.isFinite(Number(rec.virginKilled)) || Number.isFinite(Number(rec.slayerKilled));
            f.draft.devilDayActionsAppliedByDay[dayKey] = applied ? rec : null;
            saveState(appState);
            return applied;
          } catch {
            return false;
          }
        }

        function flowPhaseTitle(f) {
          if (f.phase === "intro_day")   return appLang === "fa" ? "روز معارفه" : "Intro Day";
          if (f.phase === "intro_night") return appLang === "fa" ? "شب معارفه"  : "Intro Night";
          if (f.phase === "chaos")  return appLang === "fa" ? "هرج و مرج" : "Chaos";
          if (f.phase === "winner") return appLang === "fa" ? "برنده" : "Winner";
          if (f.phase === "day")   return t("tool.flow.phase.day",   { n: f.day });
          if (f.phase === "midday") return t("tool.flow.phase.midday", { n: f.day });
          return t("tool.flow.phase.night", { n: f.day });
        }

        function hasUsableDayGuns() {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players || !draw.players.length) return false;
            const f = (appState.god && appState.god.flow) ? appState.god.flow : null;
            const guns = (f && f.guns) ? f.guns : null;
            if (!guns || typeof guns !== "object") return false;
            for (const k of Object.keys(guns)) {
              const idx = parseInt(k, 10);
              if (!Number.isFinite(idx)) continue;
              const p = draw.players[idx];
              if (!p || p.alive === false) continue;
              const g = guns[idx];
              if (g && !g.used) return true;
            }
            return false;
          } catch {
            return false;
          }
        }

        // End cards that require a separate action sub-step (pick target(s)).
        // Only cards in the scenario's eliminationCards are valid (e.g. Duel is not in Godfather).
        const END_CARD_ACTION_IDS = ["face_change", "handcuffs", "beautiful_mind", "silence_lambs"];
        function getEndCardActionStepForDay(f) {
          try {
            const scenario = getDrawScenarioForFlow();
            const cfg = getScenarioConfig(scenario);
            if (!cfg.features || !cfg.features.endCards) return null;
            const endCards = cfg.eliminationCards || [];
            const dayKey = String(f.day || 1);
            const byDay = appState.god && appState.god.endCards && appState.god.endCards.byDay ? appState.god.endCards.byDay : {};
            const rec = byDay[dayKey] && typeof byDay[dayKey] === "object" ? byDay[dayKey] : null;
            if (!rec || !rec.cardId) return null;
            // outIdx: prefer day_elim_out event (when committed), else rec.out (card drawn on day_elim before Next)
            const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "day_elim_out" && e.phase === "day" && e.day === f.day && e.data);
            const outFromEv = ev && ev.data && ev.data.out !== null && ev.data.out !== undefined && Number.isFinite(Number(ev.data.out)) ? parseInt(ev.data.out, 10) : null;
            const outFromRec = rec.out !== null && rec.out !== undefined && Number.isFinite(Number(rec.out)) ? parseInt(rec.out, 10) : null;
            const outIdx = outFromEv !== null ? outFromEv : outFromRec;
            if (outIdx === null) return null;
            if (parseInt(rec.out, 10) !== outIdx) return null;
            if (!END_CARD_ACTION_IDS.includes(rec.cardId)) return null;
            // Beautiful Mind: always show the action page (moderator chose this card deliberately).
            // When the voted-out player IS Nostradamus, the UI shows an info message instead of a pick.
            const c = endCards.find((x) => x.id === rec.cardId);
            if (!c) return null; // Card not in scenario's eliminationCards (e.g. Duel removed from Godfather)
            const label = appLang === "fa" ? c.fa : c.en;
            return { id: "day_end_card_" + rec.cardId, title: label };
          } catch { return null; }
        }

        // Returns {id:"day_end_card_pick"} when scenario supports end cards AND a player was voted out this day.
        // Stays in the flow even after a card is selected (shows it highlighted); user must click Next to advance.
        function getEndCardPickStep(f) {
          try {
            const scenario = getDrawScenarioForFlow();
            const cfg = getScenarioConfig(scenario);
            if (!cfg.features || !cfg.features.endCards) return null;
            const dayKey = String(f.day || 1);
            const elimRec = f.draft && f.draft.dayElimAppliedByDay && f.draft.dayElimAppliedByDay[dayKey];
            const outIdx = (elimRec && elimRec.out != null && Number.isFinite(parseInt(elimRec.out, 10))) ? parseInt(elimRec.out, 10) : null;
            if (outIdx === null) return null;
            return { id: "day_end_card_pick", title: getStepTitle("day_end_card_pick") };
          } catch { return null; }
        }

        // Step title lookup (uses t() where available).
        function getStepTitle(stepId) {
          const titles = {
            intro_day_run: appLang === "fa" ? "روز معارفه" : "Intro Day",
            intro_night_run: appLang === "fa" ? "شب معارفه" : "Intro Night",
            intro_night_nostradamus: appLang === "fa" ? "۱. نوستراداموس" : "1. Nostradamus",
            intro_night_mafia: appLang === "fa" ? "۲. تیم مافیا" : "2. Mafia team",
            intro_night_wake_order: appLang === "fa" ? "۳. واتسون، لئون، کین، کنستانتین" : "3. Watson, Leon, Kane, Constantine",
            chaos_run: appLang === "fa" ? "هرج و مرج" : "Chaos",
            winner_run: appLang === "fa" ? "برنده" : "Winner",
            namayande_rep_election: appLang === "fa" ? "انتخاب نماینده" : "Representative Election",
            namayande_rep_action: appLang === "fa" ? "صحبت و انتخاب هدف" : "Rep Speeches & Targets",
            namayande_cover: appLang === "fa" ? "انتخاب کاور" : "Cover Selection",
            namayande_defense: appLang === "fa" ? "دفاعیه" : "Final Defense",
            namayande_vote: appLang === "fa" ? "رأی‌گیری" : "Vote",
            kabo_trust_vote: appLang === "fa" ? "رأی اعتماد" : "Trust Vote",
            kabo_suspect_select: appLang === "fa" ? "انتخاب مظنون" : "Select Suspects",
            kabo_midday: appLang === "fa" ? "چرت روز" : "Mid-day Sleep",
            kabo_shoot: appLang === "fa" ? "دفاع و شلیک" : "Defense & Shoot",
            day_poison_status: appLang === "fa" ? "وضعیت زهر" : "Poison Status",
            night_poisoned_player: appLang === "fa" ? "بازیکن مسموم" : "Poisoned Player",
            night_herbalist_antidote: appLang === "fa" ? "تصمیم عطار (پادزهر)" : "Herbalist Decision",
            night_poison_result: appLang === "fa" ? "نتیجه زهر" : "Poison Result",
            bazras_interrogation: appLang === "fa" ? "بازپرسی" : "Interrogation",
            bazras_midday: appLang === "fa" ? "چرت روز" : "Mid-day",
            bazras_forced_vote: appLang === "fa" ? "رأی‌گیری اجباری" : "Forced Vote",
            day_end_card_pick: appLang === "fa" ? "انتخاب کارت" : "Choose Card",
            devil_intro_night: appLang === "fa" ? "شب معارفه برج ساعت" : "Clocktower Intro Night",
            devil_intro_evil_info: appLang === "fa" ? "۱. اطلاعات تیم بد و پوشش‌ها" : "1. Evil Info & Bluffs",
            devil_intro_poisoner: appLang === "fa" ? "۲. مسموم‌کننده" : "2. Poisoner",
            devil_intro_washerwoman: appLang === "fa" ? "۳. لباس‌شوی" : "3. Washerwoman",
            devil_intro_librarian: appLang === "fa" ? "۴. کتابدار" : "4. Librarian",
            devil_intro_investigator: appLang === "fa" ? "۵. بازرس" : "5. Investigator",
            devil_intro_chef: appLang === "fa" ? "۶. سرآشپز" : "6. Chef",
            devil_intro_empath: appLang === "fa" ? "۷. همدل" : "7. Empath",
            devil_intro_fortune_teller: appLang === "fa" ? "۸. فال‌گیر" : "8. Fortune Teller",
            devil_intro_butler: appLang === "fa" ? "۹. پیشخدمت" : "9. Butler",
            devil_intro_spy: appLang === "fa" ? "۱۰. جاسوس" : "10. Spy",
            devil_day_actions: appLang === "fa" ? "توانایی‌های روز برج ساعت" : "Clocktower Day Actions",
            devil_night_poisoner: appLang === "fa" ? "مسموم‌کننده" : "Poisoner",
            devil_night_monk: appLang === "fa" ? "راهب" : "Monk",
            devil_night_scarlet_woman: appLang === "fa" ? "بانوی سرخ‌پوش" : "Scarlet Woman",
            devil_night_imp: appLang === "fa" ? "دیوچه" : "Imp",
            devil_night_ravenkeeper: appLang === "fa" ? "نگهبان کلاغ" : "Ravenkeeper",
            devil_night_empath: appLang === "fa" ? "همدل" : "Empath",
            devil_night_fortune_teller: appLang === "fa" ? "فال‌گیر" : "Fortune Teller",
            devil_night_undertaker: appLang === "fa" ? "گورکن" : "Undertaker",
            devil_night_butler: appLang === "fa" ? "پیشخدمت" : "Butler",
            devil_night_spy: appLang === "fa" ? "جاسوس" : "Spy",
          };
          if (titles[stepId]) return titles[stepId];
          const tKeys = {
            day_bomb: "tool.flow.bomb.active",
            day_bomb_guard: "tool.flow.bomb.guardDecision",
            day_dawn_resolution: "tool.flow.dawn.title",
            day_dusk_resolution: "tool.flow.dusk.title",
            day_guns: "tool.flow.day.guns",
            day_gun_expiry: "tool.flow.day.gunExpiry",
            day_kane_reveal: "tool.flow.kane.revealTitle",
            nostradamus_choose_side: "tool.flow.pedarkhande.nostradamusChooseSide",
            day_vote: "tool.flow.day.vote",
            day_elim: "tool.flow.day.eliminate",
            // Pedarkhande explicit night step titles
            night_mafia_team: "tool.flow.pedarkhande.night.mafiaTeam",
            night_watson: "tool.flow.pedarkhande.night.watson",
            night_leon: "tool.flow.pedarkhande.night.leon",
            night_kane: "tool.flow.pedarkhande.night.kane",
            night_constantine: "tool.flow.pedarkhande.night.constantine",
            // Common night steps (all scenarios)
            night_mafia: "tool.flow.night.mafia",
            night_doctor: "tool.flow.night.doctor",
            night_detective: "tool.flow.night.detective",
            night_researcher: "tool.flow.night.researcher",
            night_swindler: "tool.flow.night.swindler",
            night_sniper: "tool.flow.night.sniper",
            night_inspector: "tool.flow.night.inspector",
            night_negotiator: "tool.flow.night.negotiator",
            night_reporter: "tool.flow.night.reporter",
            night_natasha: "tool.flow.night.natasha",
            night_lecter: "tool.flow.night.lecter",
            night_joker_mafia: "tool.flow.night.joker_mafia",
            night_professional: "tool.flow.night.professional",
            night_magician: "tool.flow.night.magician",
            night_bomber: "tool.flow.night.bomber",
            night_gunslinger: "tool.flow.night.gunslinger",
            night_ocean: "tool.flow.night.ocean",
            night_zodiac: "tool.flow.night.zodiac",
            night_heir: "tool.flow.night.heir",
            night_herbalist: "tool.flow.night.herbalist",
            night_armorsmith: "tool.flow.night.armorsmith",
            night_kadkhoda: "tool.flow.night.kadkhoda",
            night_hacker: "tool.flow.night.hacker",
            night_guide: "tool.flow.night.guide",
            night_bodyguard: "tool.flow.night.bodyguard",
            night_soldier: "tool.flow.night.soldier",
            night_minemaker: "tool.flow.night.minemaker",
            night_lawyer: "tool.flow.night.lawyer",
            night_nostradamus: "tool.flow.night.nostradamus",
            night_guardian: "tool.flow.night.guardian",
            night_hostageTaker: "tool.flow.night.hostageTaker",
            night_commando: "tool.flow.night.commando",
            night_gunner: "tool.flow.night.gunner",
            night_sheriff: "tool.flow.night.sheriff",
            night_freemason: "tool.flow.night.freemason",
            // Classic Pro Extended
            night_doubler: "tool.flow.night.doubler",
            night_bartender: "tool.flow.night.bartender",
            night_enchantress: "tool.flow.night.enchantress",
            night_thief: "tool.flow.night.thief",
            night_yakuza: "tool.flow.night.yakuza",
            night_outcast: "tool.flow.night.outcast",
            night_mafiaLawyer: "tool.flow.night.mafiaLawyer",
            night_shahkesh: "tool.flow.night.shahkesh",
            night_psycho: "tool.flow.night.psycho",
            night_ladyVoodoo: "tool.flow.night.ladyVoodoo",
            night_surgeon: "tool.flow.night.surgeon",
            night_psychShooter: "tool.flow.night.psychShooter",
            night_armorer: "tool.flow.night.armorer",
            night_gunmaker: "tool.flow.night.gunmaker",
            night_devout: "tool.flow.night.devout",
            night_leader: "tool.flow.night.leader",
            night_specialDetective: "tool.flow.night.specialDetective",
            night_tracker: "tool.flow.night.tracker",
            night_wizard: "tool.flow.night.wizard",
            night_antiLadyVoodoo: "tool.flow.night.antiLadyVoodoo",
            night_snowman: "tool.flow.night.snowman",
            night_priest: "tool.flow.night.priest",
            night_perizad: "tool.flow.night.perizad",
            night_reaper: "tool.flow.night.reaper",
            night_killer: "tool.flow.night.killer",
            night_nero: "tool.flow.night.nero",
            night_jackIndep: "tool.flow.night.jackIndep",
            night_gamblerIndep: "tool.flow.night.gamblerIndep",
            day_end_card_face_change: "tool.flow.endCard.faceOff",
            day_end_card_handcuffs: "tool.flow.endCard.handcuffs",
            day_end_card_beautiful_mind: "tool.flow.endCard.beautifulMind",
            day_end_card_silence_lambs: "tool.flow.endCard.silenceLambs",
          };
          const key = tKeys[stepId];
          return key && typeof t === "function" ? t(key) : null;
        }

        /** Returns array of eliminated player indices for Status Check for a given day/phase. */
        function getEliminatedForStatusCheck(f, day, phase) {
          const eliminated = [];
          const seenElim = new Set();
          const addElim = (idx) => {
            if (idx == null) return;
            const i = parseInt(idx, 10);
            if (!Number.isFinite(i) || i < 0 || seenElim.has(i)) return;
            seenElim.add(i);
            eliminated.push(i);
          };
          const dk = String(day || 1);
          if (!f || !f.draft) return eliminated;
          try {
            if (phase === "day" || phase === "midday") {
              const er = f.draft.dayElimAppliedByDay && f.draft.dayElimAppliedByDay[dk];
              if (er && !er.armoredAbsorbed && er.prevAlive === true && er.out != null) addElim(er.out);
              if (er && er.chainPrevAlive === true && er.chainOut != null) addElim(er.chainOut);
              const gr = f.draft.gunShotAppliedByDay && f.draft.gunShotAppliedByDay[dk];
              if (gr && Array.isArray(gr.shots)) {
                for (const s of gr.shots) {
                  if (s && s.type === "real" && s.targetPrevAlive && s.target != null) addElim(s.target);
                  if (s && s.chainPrevAlive && s.chainKilled != null) addElim(s.chainKilled);
                }
              }
              const br = f.draft.bombAppliedByDay && f.draft.bombAppliedByDay[dk];
              if (br && br.prevAlive === true && br.killed != null) addElim(br.killed);
              const xr = f.draft.gunExpiryAppliedByDay && f.draft.gunExpiryAppliedByDay[dk];
              if (xr && Array.isArray(xr.killed)) {
                for (const item of xr.killed) {
                  if (item && item.prevAlive && item.idx != null) addElim(item.idx);
                }
              }
              const irec = f.draft.bazrasInterrogationByDay && f.draft.bazrasInterrogationByDay[dk];
              if (irec && irec.decision === "continue") {
                if (irec.prevAlive === true && irec.prevEliminated != null) addElim(irec.prevEliminated);
                else if (irec.prevEliminated == null && irec.votes) {
                  const prevNK = String(Math.max(0, parseInt(dk, 10) - 1));
                  const invTfv = f.draft.investigatorTargetsByNight && f.draft.investigatorTargetsByNight[prevNK];
                  const ft1 = invTfv && invTfv.t1 != null ? invTfv.t1 : null;
                  const ft2 = invTfv && invTfv.t2 != null ? invTfv.t2 : null;
                  if (ft1 != null && ft2 != null) {
                    const pv1 = Math.max(0, parseInt(irec.votes[ft1] || 0, 10));
                    const pv2 = Math.max(0, parseInt(irec.votes[ft2] || 0, 10));
                    if (pv1 > pv2) addElim(ft1);
                    else if (pv2 > pv1) addElim(ft2);
                  }
                }
              }
              // Kane reveal: role is revealed but player stays in game (not eliminated)
            } else if (phase === "night") {
              const mr = f.draft.nightMafiaAppliedByDay && f.draft.nightMafiaAppliedByDay[dk];
              if (mr && mr.prevAlive === true && mr.killed != null) addElim(mr.killed);
              if (mr && mr.chainPrevAlive === true && mr.chainKilled != null) addElim(mr.chainKilled);
              const zr = f.draft.nightZodiacAppliedByDay && f.draft.nightZodiacAppliedByDay[dk];
              if (zr && zr.prevAlive === true && zr.killed != null) addElim(zr.killed);
              const pr = f.draft.nightProAppliedByDay && f.draft.nightProAppliedByDay[dk];
              if (pr && pr.prevAlive === true && pr.killed != null) addElim(pr.killed);
              const sr = f.draft.nightSniperAppliedByDay && f.draft.nightSniperAppliedByDay[dk];
              if (sr && sr.prevAlive === true && sr.killed != null) addElim(sr.killed);
              const ocr = f.draft.nightOceanAppliedByDay && f.draft.nightOceanAppliedByDay[dk];
              if (ocr && ocr.killedOcean === true && ocr.prevAlive === true && ocr.oceanIdx != null) addElim(ocr.oceanIdx);
              const hr = f.draft.nightHerbalistAppliedByDay && f.draft.nightHerbalistAppliedByDay[dk];
              if (hr && hr.prevAlive === true && hr.killed != null) addElim(hr.killed);
              const sod = f.draft.nightSodagariAppliedByDay && f.draft.nightSodagariAppliedByDay[dk];
              if (sod && sod.prevAlive === true && sod.sacrifice != null) addElim(sod.sacrifice);
              const sixthRec = f.draft.nightSixthSenseAppliedByDay && f.draft.nightSixthSenseAppliedByDay[dk];
              if (sixthRec && sixthRec.prevAlive === true && sixthRec.killed != null) addElim(sixthRec.killed);
              const execRec = f.draft.nightExecutionerAppliedByDay && f.draft.nightExecutionerAppliedByDay[dk];
              if (execRec && execRec.prevAlive === true && execRec.killed != null) addElim(execRec.killed);
              const solRec = f.draft.nightSoldierAppliedByDay && f.draft.nightSoldierAppliedByDay[dk];
              if (solRec && solRec.soldierPrevAlive === true && solRec.soldierKilled != null) addElim(solRec.soldierKilled);
              if (solRec && solRec.gunShotPrevAlive === true && solRec.gunShotKilled != null) addElim(solRec.gunShotKilled);
              // Pedarkhande: Kane invisible bullet (24h after correct mafia reveal)
              if (getDrawScenarioForFlow() === "pedarkhande" && f.draft.kaneInvisibleBulletByNight != null && Number(f.draft.kaneInvisibleBulletByNight) === parseInt(dk, 10)) {
                const kaneIdx = (appState.draw && appState.draw.players) ? appState.draw.players.findIndex((p) => p && p.roleId === "citizenKane") : -1;
                if (kaneIdx !== -1) addElim(kaneIdx);
              }
            }
          } catch {}
          return eliminated;
        }

        /** Returns array of revived player indices for Status Check for a given day/phase. */
        function getRevivedForStatusCheck(f, day, phase) {
          const revived = [];
          const dk = String(day || 1);
          if (!f || !f.draft) return revived;
          try {
            if (phase === "night") {
              const cr = f.draft.nightConstantineAppliedByDay && f.draft.nightConstantineAppliedByDay[dk];
              if (cr && cr.revived != null && Number.isFinite(parseInt(cr.revived, 10))) {
                revived.push(parseInt(cr.revived, 10));
              }
            }
          } catch {}
          return revived;
        }

        // Single source of truth for eliminated/revived lists — expose for Status Check, Dawn, Dusk, etc.
        if (typeof window !== "undefined") {
          window.getEliminatedForStatusCheck = getEliminatedForStatusCheck;
          window.getRevivedForStatusCheck = getRevivedForStatusCheck;
        }

        /** Returns unified array of role-change entries for Status Check.
         * Each entry: { type: "face_off", out, target, outRole, tgtRole } or { type: "saul_buy", idx, newRole }.
         * Face Off: out got tgtRole, target got outRole. Saul Buy: idx became newRole (mafia). */
        function getChangedRolesForStatusCheck(f, day, phase) {
          const entries = [];
          const dk = String(day || 1);
          if (!f || !f.draft) return entries;
          try {
            if (phase === "day" || phase === "midday") {
              const rec = f.draft.endCardActionAppliedByDay && f.draft.endCardActionAppliedByDay[dk];
              if (rec && rec.cardId === "face_change" && rec.out != null && rec.target != null && rec.prevState) {
                const out = parseInt(rec.out, 10);
                const target = parseInt(rec.target, 10);
                const outRole = rec.prevState.outRole || "citizen";
                const tgtRole = rec.prevState.tgtRole || "citizen";
                if (Number.isFinite(out) && Number.isFinite(target)) {
                  entries.push({ type: "face_off", out, target, outRole, tgtRole });
                }
              }
            }
            if (phase === "night") {
              const sr = f.draft.nightSaulBuyAppliedByDay && f.draft.nightSaulBuyAppliedByDay[dk];
              if (sr && sr.converted != null && Number.isFinite(parseInt(sr.converted, 10))) {
                entries.push({ type: "saul_buy", idx: parseInt(sr.converted, 10), newRole: "mafia" });
              }
              const heirRec = f.draft.heirInheritedByDay && f.draft.heirInheritedByDay[dk];
              if (heirRec && heirRec.heirIdx != null && heirRec.newRole != null) {
                entries.push({ type: "heir_inherit", idx: parseInt(heirRec.heirIdx, 10), newRole: heirRec.newRole });
              }
            }
          } catch {}
          return entries;
        }

        /** Returns true if Status Check has the data to show the Herbalist antidote decision for a given night.
         * gave: true = gave antidote, false = withheld. */
        function hasStatusCheckHerbalistAntidoteDecision(f, day, gave) {
          if (!f || !f.events || !f.draft) return false;
          const dk = String(day || 1);
          const ev = (f.events || []).find((e) => e && e.kind === "night_actions" && e.phase === "night" && String(e.day) === dk);
          if (!ev || !ev.data) return false;
          const payload = ev.data;
          const antidote = (payload.herbalistAntidote != null && Number.isFinite(parseInt(payload.herbalistAntidote, 10))) ? parseInt(payload.herbalistAntidote, 10) : null;
          const prevNightKey = String(Math.max(0, (day || 1) - 1));
          const prevNa = (f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) ? f.draft.nightActionsByNight[prevNightKey] : null;
          const prevPoison = (prevNa && prevNa.herbalistPoison != null && Number.isFinite(parseInt(prevNa.herbalistPoison, 10))) ? parseInt(prevNa.herbalistPoison, 10) : null;
          if (prevPoison === null || day < 2) return false;
          return gave ? (antidote !== null && antidote === prevPoison) : (antidote === null);
        }

        /** Returns true if Status Check has the data to show the Executioner guess-role action for a given night.
         * Used by tests to verify the action will appear in the Status Check list. */
        function hasStatusCheckExecutionerActionData(f, day) {
          if (!f || !f.events || !f.draft) return false;
          const dk = String(day || 1);
          const execRec = (f.draft.nightExecutionerAppliedByDay && f.draft.nightExecutionerAppliedByDay[dk]) ? f.draft.nightExecutionerAppliedByDay[dk] : null;
          if (!execRec || execRec.killed == null) return false;
          const ev = (f.events || []).find((e) => e && e.kind === "night_actions" && e.phase === "night" && String(e.day) === dk);
          if (!ev || !ev.data) return false;
          const payload = ev.data;
          const godfatherAction = (payload.godfatherAction != null) ? String(payload.godfatherAction) : "";
          if (godfatherAction !== "guess_role") return false;
          const target = (payload.executionerTarget != null && Number.isFinite(parseInt(payload.executionerTarget, 10))) ? parseInt(payload.executionerTarget, 10) : null;
          const role = (payload.executionerRoleGuess != null && String(payload.executionerRoleGuess).trim()) ? String(payload.executionerRoleGuess).trim() : null;
          return target !== null && role !== null;
        }

        /** Returns true if Status Check would show playerIdx in the Eliminated list.
         * Replicates the group-creation logic: day groups exist from events OR from
         * sixthSenseAppliedByDay / kaneRevealAppliedByDay (no events yet). */
        function wouldStatusCheckShowEliminated(f, playerIdx) {
          if (!f || !Number.isFinite(parseInt(playerIdx, 10))) return false;
          const idx = parseInt(playerIdx, 10);
          const curFlowDay = f.day || 1;
          const d = f.draft || {};
          try {
            for (const ev of (f.events || [])) {
              if (!ev || !ev.phase || ev.day == null) continue;
              const day = parseInt(ev.day, 10);
              if (!Number.isFinite(day) || day > curFlowDay) continue;
              const phase = String(ev.phase);
              if (!["day", "midday", "night"].includes(phase)) continue;
              const elim = getEliminatedForStatusCheck(f, day, phase);
              if (elim.includes(idx)) return true;
            }
            // Kane reveal: role revealed but player stays in game (not eliminated)
          } catch {}
          return false;
        }

        function getFlowSteps(f) {
          const scenario = String(getDrawScenarioForFlow() || "").toLowerCase();
          const flowCfg = typeof getFlowConfig === "function" ? getFlowConfig(scenario) : null;
          const currentDrawHasAnyRole = (roleIds) => {
            try {
              const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
              const players = (appState.draw && appState.draw.players) || [];
              return players.some((p) => p && ids.includes(p.roleId));
            } catch {
              return true;
            }
          };

          if (f.phase === "intro_day") {
            const ids = (flowCfg && flowCfg.intro_day) ? flowCfg.intro_day : ["intro_day_run"];
            return ids.map((id) => ({ id, title: getStepTitle(id) }));
          }
          if (f.phase === "intro_night") {
            let ids = (flowCfg && flowCfg.intro_night) ? flowCfg.intro_night : ["intro_night_run"];
            if (scenario === "devil") {
              const introStepRoles = {
                devil_intro_poisoner: ["devilPoisoner"],
                devil_intro_washerwoman: ["devilWasherwoman"],
                devil_intro_librarian: ["devilLibrarian"],
                devil_intro_investigator: ["devilInvestigator"],
                devil_intro_chef: ["devilChef"],
                devil_intro_empath: ["devilEmpath"],
                devil_intro_fortune_teller: ["devilFortuneTeller"],
                devil_intro_butler: ["devilButler"],
                devil_intro_spy: ["devilSpy"],
              };
              ids = ids.filter((id) => !introStepRoles[id] || currentDrawHasAnyRole(introStepRoles[id]));
            }
            // Pedarkhande: nostradamus_choose_side when Nostradamus exists and has picked 3
            if (scenario === "pedarkhande" && ids.includes("nostradamus_choose_side")) {
              const d = (f.draft || {});
              const pick3 = (d.nightActionsByNight && d.nightActionsByNight["0"] && Array.isArray(d.nightActionsByNight["0"].nostPick3)) ? d.nightActionsByNight["0"].nostPick3 : [];
              const has3Picks = pick3.length >= 3;
              const hasNostradamus = (appState.draw && appState.draw.players || []).some((p) => p && p.roleId === "nostradamus");
              if (!hasNostradamus || !has3Picks) {
                ids = ids.filter((id) => id !== "nostradamus_choose_side");
              }
            }
            return ids.map((id) => ({ id, title: getStepTitle(id) }));
          }
          if (f.phase === "chaos")  return [{ id: "chaos_run",  title: getStepTitle("chaos_run") }];
          if (f.phase === "winner") return [{ id: "winner_run", title: getStepTitle("winner_run") }];
          if (f.phase === "day") {
            const dayNum = f.day || 1;
            const dayCfg = flowCfg && flowCfg.day ? flowCfg.day : { base: ["day_vote", "day_elim"] };

            // Dawn resolution: first step every morning (Day 2+) — shows who died and who was revived last night.
            const prependDawnStepIfNeeded = (stepObjs) => {
              if (dayNum >= 2 && Array.isArray(stepObjs) && stepObjs.length > 0) {
                const first = stepObjs[0];
                if (first && first.id !== "day_dawn_resolution") {
                  return [{ id: "day_dawn_resolution", title: getStepTitle("day_dawn_resolution") }, ...stepObjs];
                }
              }
              return stepObjs;
            };
            // Dusk resolution: last step every day — shows who left the game during the day.
            const appendDuskStepIfNeeded = (stepObjs) => {
              if (!Array.isArray(stepObjs) || stepObjs.length === 0) return stepObjs;
              const last = stepObjs[stepObjs.length - 1];
              if (last && last.id === "day_dusk_resolution") return stepObjs;
              return [...stepObjs, { id: "day_dusk_resolution", title: getStepTitle("day_dusk_resolution") }];
            };

            // Namayande: day1 vs default
            if (scenario === "namayande") {
              const ids = (dayNum === 1 && dayCfg.day1) ? dayCfg.day1 : (dayCfg.default || dayCfg.base);
              return appendDuskStepIfNeeded(prependDawnStepIfNeeded(ids.map((id) => ({ id, title: getStepTitle(id) }))));
            }
            // Kabo: day1 conditional (trust vote → suspect → midday → shoot)
            if (scenario === "kabo") {
              if (dayNum === 1) {
                const hasTrusted = !!(f.draft && f.draft.kaboTrustedByDay && f.draft.kaboTrustedByDay["1"] != null);
                const ids = hasTrusted && dayCfg.day1
                  ? dayCfg.day1
                  : ["kabo_trust_vote"];
                const stepObjs = ids.map((id) => ({ id, title: getStepTitle(id) }));
                // When tie (only trust vote), no Dusk — nothing to show yet; Dusk requires Trusted + flow to complete.
                return (ids.length === 1 && ids[0] === "kabo_trust_vote")
                  ? stepObjs
                  : appendDuskStepIfNeeded(stepObjs);
              }
              // Day 2+: poison status before voting if poison from previous night is pending (victim alive, will resolve at Night 2)
              const prevNightKey = String(Math.max(0, dayNum - 1));
              const prevNa = (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) || null;
              const poisonIdx = (prevNa && prevNa.herbalistPoison != null && Number.isFinite(parseInt(prevNa.herbalistPoison, 10))) ? parseInt(prevNa.herbalistPoison, 10) : null;
              const victimAlive = poisonIdx != null && appState.draw && appState.draw.players && appState.draw.players[poisonIdx] && appState.draw.players[poisonIdx].alive !== false;
              const poisonPending = !!(poisonIdx != null && victimAlive);
              const baseIds = dayCfg.default || dayCfg.base;
              const ids = poisonPending ? ["day_poison_status", ...baseIds] : baseIds;
              return appendDuskStepIfNeeded(prependDawnStepIfNeeded(ids.map((id) => ({ id, title: getStepTitle(id) }))));
            }
            // Bazras: optional interrogation at start
            if (scenario === "bazras") {
              const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[String(f.day)]))
                ? f.draft.dayStepsByDay[String(f.day)] : null;
              if (snapshotIds) {
                const pickStep = getEndCardPickStep(f);
                const endCardStep = getEndCardActionStepForDay(f);
                // Strip end-card steps AND dusk from snapshot — dusk is re-added by appendDuskStepIfNeeded so
                // end-card steps always appear in the correct position (before dusk, not after).
                const withoutEndCard = snapshotIds.filter((id) => !id || !(id === "day_end_card_pick" || id === "day_dusk_resolution" || String(id).startsWith("day_end_card_")));
                const ids = [...withoutEndCard, ...(pickStep ? [pickStep.id] : []), ...(endCardStep ? [endCardStep.id] : [])];
                const stepObjs = ids.map((id) => {
                  if (pickStep && id === pickStep.id) return pickStep;
                  if (endCardStep && id === endCardStep.id) return endCardStep;
                  return { id, title: getStepTitle(id) };
                });
                return appendDuskStepIfNeeded(prependDawnStepIfNeeded(stepObjs));
              }
              const prevNightKey = String(Math.max(0, dayNum - 1));
              const invTargets = (f.draft && f.draft.investigatorTargetsByNight && f.draft.investigatorTargetsByNight[prevNightKey]) || null;
              const showInterrogation = (() => {
                try {
                  if (!invTargets || invTargets.t1 == null || invTargets.t2 == null) return false;
                  const draw = appState.draw;
                  if (!draw || !draw.players) return false;
                  const p1 = draw.players[invTargets.t1];
                  const p2 = draw.players[invTargets.t2];
                  return !!(p1 && p1.alive !== false && p2 && p2.alive !== false);
                } catch { return false; }
              })();
              let ids = [];
              if (showInterrogation && dayCfg.interrogation) ids = ids.concat(dayCfg.interrogation);
              ids = ids.concat(dayCfg.base || ["day_vote", "day_elim"]);
              const pickStep = getEndCardPickStep(f);
              if (pickStep) ids.push(pickStep.id);
              const endCardStep = getEndCardActionStepForDay(f);
              if (endCardStep) ids.push(endCardStep.id);
              const stepObjs = ids.map((id) => {
                if (pickStep && id === pickStep.id) return pickStep;
                if (endCardStep && id === endCardStep.id) return endCardStep;
                return { id, title: getStepTitle(id) };
              });
              return appendDuskStepIfNeeded(prependDawnStepIfNeeded(stepObjs));
            }

            // Generic day: use snapshot if available, else compute from config + conditionals
            const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[String(f.day)]))
              ? f.draft.dayStepsByDay[String(f.day)] : null;
            if (snapshotIds) {
              // Recompute end card steps from live state (avoids stale snapshot when votes change).
              // Strip dusk as well so end-card steps land before dusk after re-assembly.
              const pickStep = getEndCardPickStep(f);
              const endCardStep = getEndCardActionStepForDay(f);
              const withoutEndCard = snapshotIds.filter((id) => !id || !(id === "day_end_card_pick" || id === "day_dusk_resolution" || String(id).startsWith("day_end_card_")));
              const ids = [...withoutEndCard, ...(pickStep ? [pickStep.id] : []), ...(endCardStep ? [endCardStep.id] : [])];
              const stepObjs = ids.map((id) => {
                if (pickStep && id === pickStep.id) return pickStep;
                if (endCardStep && id === endCardStep.id) return endCardStep;
                return { id, title: getStepTitle(id) };
              });
              return appendDuskStepIfNeeded(prependDawnStepIfNeeded(stepObjs));
            }

            // Compute steps from config + runtime conditionals.
            // Flow-config (dayCfg.steps or dayCfg.base) is the single source of truth — presence of day_guns/day_gun_expiry means scenario supports them.
            const steps = [];
            const hasBombForStep = (() => {
              try {
                const d = f.draft || {};
                const rec = (d.bombByDay && d.bombByDay[String(f.day)]) ? d.bombByDay[String(f.day)] : null;
                return !!(f.bombActive || (rec && rec.target !== null && rec.target !== undefined));
              } catch { return !!f.bombActive; }
            })();
            // Bomb announcement: insert day_bomb as its own early step (right after Dawn) so
            // the moderator reads it aloud first, before gun/vote steps.
            const prependBombStepIfNeeded = (stepObjs) => {
              if (!hasBombForStep || !Array.isArray(stepObjs)) return stepObjs;
              const result = [];
              let bombInserted = false;
              let guardStepInserted = false;
              for (const s of stepObjs) {
                // Insert day_bomb_guard right before day_vote (mid-day nap, just before voting).
                if (!guardStepInserted && s.id === "day_vote") {
                  result.push({ id: "day_bomb_guard", title: getStepTitle("day_bomb_guard") });
                  guardStepInserted = true;
                }
                result.push(s);
                if (!bombInserted && s.id === "day_dawn_resolution") {
                  result.push({ id: "day_bomb", title: getStepTitle("day_bomb") });
                  bombInserted = true;
                }
              }
              if (!bombInserted) result.unshift({ id: "day_bomb", title: getStepTitle("day_bomb") });
              // Fallback: if day_vote was not in the step list, append day_bomb_guard at the end.
              if (!guardStepInserted) result.push({ id: "day_bomb_guard", title: getStepTitle("day_bomb_guard") });
              return result;
            };
            const kaneRevealIdx = (() => {
              try {
                const prevNight = dayNum - 1;
                const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === prevNight && e.data);
                const payload = ev && ev.data ? ev.data : null;
                if (!payload) return null;
                const raw = payload.kaneMark;
                const idx = (raw !== null && raw !== undefined && Number.isFinite(parseInt(raw, 10))) ? parseInt(raw, 10) : null;
                if (idx === null) return null;
                const draw = appState.draw;
                if (!draw || !draw.players) return null;
                const p = draw.players[idx];
                if (!p) return null;
                const rid = p.roleId || "citizen";
                const teamFa = (roles[rid] && roles[rid].teamFa) ? roles[rid].teamFa : "شهر";
                return teamFa === "مافیا" ? idx : null;
              } catch { return null; }
            })();
            const prevNightKey = String(Math.max(0, dayNum - 1));
            const prevNa = (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) || null;
            const poisonIdx = (prevNa && prevNa.herbalistPoison != null && Number.isFinite(parseInt(prevNa.herbalistPoison, 10))) ? parseInt(prevNa.herbalistPoison, 10) : null;
            const victimAlive = poisonIdx != null && appState.draw && appState.draw.players && appState.draw.players[poisonIdx] && appState.draw.players[poisonIdx].alive !== false;
            const poisonPending = !!(poisonIdx != null && victimAlive);

            const stepIds = Array.isArray(dayCfg.steps) ? dayCfg.steps : null;
            if (stepIds) {
              for (const rawId of stepIds) {
                const optional = String(rawId).endsWith("?");
                const id = optional ? String(rawId).slice(0, -1) : String(rawId);
                if (id === "day_vote" && poisonPending) {
                  steps.push({ id: "day_poison_status", title: getStepTitle("day_poison_status") });
                }
                if (id === "day_kane_reveal") {
                  if (kaneRevealIdx !== null) steps.push({ id: "day_kane_reveal", title: getStepTitle("day_kane_reveal") });
                  continue;
                }
                if (id === "end_card_action" || id === "__end_card__") {
                  const pickStep = getEndCardPickStep(f);
                  if (pickStep) steps.push(pickStep);
                  const endCardStep = getEndCardActionStepForDay(f);
                  if (endCardStep) steps.push(endCardStep);
                  continue;
                }
                if (id === "day_guns" && !hasUsableDayGuns()) continue;
                if (id === "day_gun_expiry" && !hasUnfiredRealGuns()) continue;
                steps.push({ id, title: getStepTitle(id) });
              }
              return appendDuskStepIfNeeded(prependBombStepIfNeeded(prependDawnStepIfNeeded(steps)));
            }

            if (dayCfg.kaneReveal && kaneRevealIdx !== null) {
              steps.push({ id: "day_kane_reveal", title: getStepTitle("day_kane_reveal") });
            }
            const baseIds = dayCfg.base || ["day_vote", "day_elim"];
            if (poisonPending && baseIds.includes("day_vote")) {
              steps.push({ id: "day_poison_status", title: getStepTitle("day_poison_status") });
            }
            for (const id of baseIds) {
              if (id === "day_guns" && !hasUsableDayGuns()) continue;
              if (id === "day_gun_expiry" && !hasUnfiredRealGuns()) continue;
              steps.push({ id, title: getStepTitle(id) });
            }
            if (dayCfg.endCards) {
              const pickStep = getEndCardPickStep(f);
              if (pickStep) steps.push(pickStep);
              const endCardStep = getEndCardActionStepForDay(f);
              if (endCardStep) steps.push(endCardStep);
            }
            return appendDuskStepIfNeeded(prependBombStepIfNeeded(prependDawnStepIfNeeded(steps)));
          }
          // Per-role night steps: one step per wake order entry (same order as Wake tool).
          const cfg = getScenarioConfig(scenario);
          const wakeOrder = cfg.wakeOrder || {};
          const lang = (typeof appLang !== "undefined" && appLang === "fa") ? "fa" : "en";
          const wake = (wakeOrder[lang] && wakeOrder[lang].length) ? wakeOrder[lang] : (wakeOrder.en || wakeOrder.fa || []);
          const evenNight = ((f.day || 1) % 2) === 0;
          const bombAlreadyUsed = (() => {
            try {
              const d = f.draft || {};
              if (d.bombByDay && typeof d.bombByDay === "object") {
                for (const day of Object.keys(d.bombByDay)) {
                  const rec = d.bombByDay[day];
                  if (rec && (rec.target !== null && rec.target !== undefined)) return true;
                }
              }
              if (Array.isArray(f.events)) {
                if (f.events.some((e) => e && e.kind === "bomb_resolve")) return true;
              }
              return false;
            } catch { return false; }
          })();
          const labelLower = (w) => String(w || "").toLowerCase();
          const keepZodiac = (w) => {
            const x = labelLower(w);
            return evenNight || (!x.includes("zodiac") && !x.includes("زودیاک"));
          };
          const keepBomber = (w) => {
            const x = labelLower(w);
            const isBomber = x.includes("bomber") || x.includes("بمب");
            return !isBomber || !bombAlreadyUsed;
          };
          const keepNotIntroOnly = (w) => {
            const x = labelLower(w);
            return !x.includes("intro night only") && !x.includes("فقط شب معارفه");
          };
          // Pedarkhande: skip Kane step only when Kane is dead (invisible bullet).
          // When ability used (wrong guess), still show step with "ability used" message.
          const keepKaneAlive = (w, stepId) => {
            if (scenario !== "pedarkhande") return true;
            const isKaneStep = (stepId && String(stepId).includes("kane")) || labelLower(w).includes("kane") || labelLower(w).includes("کین");
            if (!isKaneStep) return true;
            const draw = appState.draw;
            if (!draw || !draw.players) return true;
            const kaneIdx = draw.players.findIndex((p) => p && p.roleId === "citizenKane");
            if (kaneIdx === -1) return true;
            if (draw.players[kaneIdx].alive === false) return false;
            return true;
          };
          // Skip night steps for roles not in the draw (e.g. no Kadkhoda → no Kadkhoda step)
          const keepRoleInDraw = (stepId) => {
            const draw = appState.draw;
            if (!draw || !draw.players) return true;
            const sid = String(stepId || "");
            if (sid === "night_mafia") {
              const hasMafia = draw.players.some((p) => p && p.roleId && (roles[p.roleId] && roles[p.roleId].teamFa === "مافیا"));
              return hasMafia;
            }
            const stepToRoles = {
              night_heir: ["heir"],
              night_herbalist: ["herbalist"],
              night_detective: ["detective"],
              night_armorsmith: ["armorsmith"],
              night_kadkhoda: ["kadkhoda"],
              night_doctor: ["doctor", "watson"],
              night_constantine: ["constantine"],
              night_kane: ["citizenKane"],
              night_ocean: ["ocean"],
              night_bomber: ["bomber"],
              night_zodiac: ["zodiac"],
              night_professional: ["professional", "leon"],
              night_sniper: ["sniper"],
              night_negotiator: ["negotiator"],
              night_reporter: ["reporter"],
              night_researcher: ["researcher"],
              night_swindler: ["swindler"],
              night_natasha: ["natasha"],
              night_joker_mafia: ["jokerMafia"],
              night_lecter: ["doctorLecter"],
              night_magician: ["magician"],
              night_hacker: ["hacker"],
              night_guide: ["guide"],
              night_bodyguard: ["bodyguard"],
              night_minemaker: ["minemaker"],
              night_lawyer: ["lawyer"],
              night_soldier: ["soldier"],
              night_nato: ["nato"],
              night_inspector: ["investigator"],
              // Classic Pro Extended
              night_doubler: ["doubler"],
              night_bartender: ["bartender"],
              night_enchantress: ["enchantress"],
              night_thief: ["thief"],
              night_yakuza: ["yakuza"],
              night_outcast: ["outcast"],
              night_mafiaLawyer: ["mafiaLawyer"],
              night_shahkesh: ["shahkesh"],
              night_psycho: ["psycho"],
              night_ladyVoodoo: ["ladyVoodoo"],
              night_surgeon: ["surgeon"],
              night_psychShooter: ["psychShooter"],
              night_armorer: ["armorer"],
              night_gunmaker: ["gunmaker"],
              night_devout: ["devout"],
              night_leader: ["leader"],
              night_specialDetective: ["specialDetective"],
              night_tracker: ["tracker"],
              night_wizard: ["wizard"],
              night_antiLadyVoodoo: ["antiLadyVoodoo"],
              night_snowman: ["snowman"],
              night_priest: ["priest"],
              night_perizad: ["perizad"],
              night_reaper: ["reaper"],
              night_killer: ["killer"],
              night_nero: ["nero"],
              night_jackIndep: ["jackIndep"],
              night_gamblerIndep: ["gamblerIndep"],
              devil_night_poisoner: ["devilPoisoner"],
              devil_night_monk: ["devilMonk"],
              devil_night_scarlet_woman: ["devilScarletWoman"],
              devil_night_imp: ["devilImp"],
              devil_night_ravenkeeper: ["devilRavenkeeper"],
              devil_night_empath: ["devilEmpath"],
              devil_night_fortune_teller: ["devilFortuneTeller"],
              devil_night_undertaker: ["devilUndertaker"],
              devil_night_butler: ["devilButler"],
              devil_night_spy: ["devilSpy"],
            };
            const roleIds = stepToRoles[sid];
            if (!roleIds) return true;
            const hasRole = draw.players.some((p) => p && roleIds.includes(p.roleId));
            return hasRole;
          };
          // Build kept labels and stepIds in parallel — same filter applied to both so indices stay aligned.
          // Using wake index i for nightStepIds would misalign when middle entries are filtered
          // (e.g. bomber already used, zodiac on odd nights): kept[k] must use the k-th kept stepId.
          const nightStepIds = Array.isArray(flowCfg && flowCfg.night) ? flowCfg.night : null;
          const keptLabels = [];
          const keptStepIds = [];
          for (let i = 0; i < wake.length; i++) {
            const w = wake[i];
            const stepId = (nightStepIds && i < nightStepIds.length) ? String(nightStepIds[i]) : "night_step_" + keptStepIds.length;
            if (keepZodiac(w) && keepBomber(w) && keepNotIntroOnly(w) && keepKaneAlive(w, stepId) && keepRoleInDraw(stepId)) {
              keptLabels.push(w);
              keptStepIds.push(stepId);
            }
          }
          let steps = keptLabels.map((label, k) => ({
            id: keptStepIds[k] || ("night_step_" + k),
            title: getStepTitle(keptStepIds[k]) || label,
          }));

          // Kabo: inject poison steps at start of Night N when poison from Night N-1 is pending (victim alive).
          if (scenario === "kabo" && (f.day || 1) >= 2) {
            const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
            const prevNa = (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) || null;
            const poisonIdx = (prevNa && prevNa.herbalistPoison != null && Number.isFinite(parseInt(prevNa.herbalistPoison, 10))) ? parseInt(prevNa.herbalistPoison, 10) : null;
            const victimAlive = poisonIdx != null && appState.draw && appState.draw.players && appState.draw.players[poisonIdx] && appState.draw.players[poisonIdx].alive !== false;
            if (poisonIdx != null && victimAlive) {
              steps = [
                { id: "night_poisoned_player", title: getStepTitle("night_poisoned_player") },
                { id: "night_herbalist_antidote", title: getStepTitle("night_herbalist_antidote") },
                { id: "night_poison_result", title: getStepTitle("night_poison_result") },
                ...steps,
              ];
            }
          }

          return steps;
        }

        // Apply Heir role inheritance at the night→day transition.
        // Called AFTER all night kills are applied, so we can see who actually died.
        // If the Heir's picked player is now dead (and Heir hasn't inherited yet),
        // change the Heir's roleId to the inherited role. Reversible via revertNightDeaths.
        function applyHeirInheritanceFromPayload(f) {
          try {
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            const d = f.draft;
            const dayKey = String(f.day || 1);

            // Find the alive Heir player.
            const heirIdx = draw.players.findIndex((p) => p && p.roleId === "heir" && p.alive !== false);
            if (heirIdx === -1) return false;

            // Find heirPick from any night's saved actions.
            const heirPick = (() => {
              if (!d.nightActionsByNight) return null;
              for (const nk of Object.keys(d.nightActionsByNight)) {
                const na = d.nightActionsByNight[nk];
                if (na && na.heirPick !== null && na.heirPick !== undefined) {
                  const idx = parseInt(na.heirPick, 10);
                  if (Number.isFinite(idx)) return idx;
                }
              }
              return null;
            })();
            if (heirPick === null) return false;

            // Check if inheritance was already applied in a previous night.
            if (!d.heirInheritedByDay || typeof d.heirInheritedByDay !== "object") d.heirInheritedByDay = {};
            const alreadyInherited = Object.keys(d.heirInheritedByDay).some((k) => {
              const r = d.heirInheritedByDay[k];
              return r && r.heirIdx === heirIdx && r.newRole !== null;
            });
            if (alreadyInherited) return false;

            // Check if the picked player is now dead.
            const pickedPlayer = draw.players[heirPick];
            if (!pickedPlayer || pickedPlayer.alive !== false) return false;

            // Apply: change Heir's roleId to the picked player's role.
            const newRole = pickedPlayer.roleId || "citizen";
            const prevRole = draw.players[heirIdx].roleId;
            draw.players[heirIdx].roleId = newRole;
            d.heirInheritedByDay[dayKey] = { heirIdx, prevRole, newRole, pickedIdx: heirPick };
            saveState(appState);
            return true;
          } catch {
            return false;
          }
        }

        // Apply Natasha's silence — stores silenced player for the NEXT day's elimination vote.
        function applyNightNatashaFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const targetRaw = payload.natashaTarget;
            const targetIdx = (targetRaw !== null && targetRaw !== undefined && Number.isFinite(parseInt(targetRaw, 10)))
              ? parseInt(targetRaw, 10) : null;
            if (targetIdx === null || targetIdx < 0 || targetIdx >= draw.players.length) return false;
            const affectedDay = String((f.day || 1) + 1);
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.silencedByDay || typeof f.draft.silencedByDay !== "object") f.draft.silencedByDay = {};
            f.draft.silencedByDay[affectedDay] = [targetIdx];
            return true;
          } catch { return false; }
        }

        // Apply Sheriff reveal — records which mafia member was shown (informational only, no kills).
        function applyNightSheriffFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const revealRaw = payload.sheriffReveal;
            const revealIdx = (revealRaw !== null && revealRaw !== undefined && Number.isFinite(parseInt(revealRaw, 10)))
              ? parseInt(revealRaw, 10) : null;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.sheriffRevealByNight || typeof f.draft.sheriffRevealByNight !== "object") f.draft.sheriffRevealByNight = {};
            f.draft.sheriffRevealByNight[String(f.day || 1)] = { revealed: revealIdx, at: flowRecordTimestamp() };
            return true;
          } catch { return false; }
        }

        // Apply Freemason action — if target is mafia, both freemason and target are eliminated.
        function applyNightFreemasonFromPayload(f, payload) {
          try {
            if (!f || !payload) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const targetRaw = payload.freemasonTarget;
            const targetIdx = (targetRaw !== null && targetRaw !== undefined && Number.isFinite(parseInt(targetRaw, 10)))
              ? parseInt(targetRaw, 10) : null;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (!f.draft.nightFreemasonAppliedByDay || typeof f.draft.nightFreemasonAppliedByDay !== "object") f.draft.nightFreemasonAppliedByDay = {};
            const dayKey = String(f.day || 1);
            const rec = { targetIdx, targetWasMafia: false, freeKilled: null, freePrevAlive: null, tgtKilled: null, tgtPrevAlive: null };
            if (targetIdx !== null && targetIdx >= 0 && targetIdx < draw.players.length) {
              const tRole = (draw.players[targetIdx] && draw.players[targetIdx].roleId) ? draw.players[targetIdx].roleId : "citizen";
              const tIsMafia = roles[tRole] && roles[tRole].teamFa === "مافیا";
              if (tIsMafia) {
                rec.targetWasMafia = true;
                let freeIdx = null;
                for (let i = 0; i < draw.players.length; i++) {
                  if (draw.players[i] && draw.players[i].roleId === "freemason") { freeIdx = i; break; }
                }
                if (freeIdx !== null && draw.players[freeIdx] && draw.players[freeIdx].alive !== false) {
                  rec.freeKilled = freeIdx;
                  rec.freePrevAlive = true;
                  try { setPlayerLife(freeIdx, { alive: false }); } catch {}
                }
                if (draw.players[targetIdx] && draw.players[targetIdx].alive !== false) {
                  rec.tgtKilled = targetIdx;
                  rec.tgtPrevAlive = true;
                  try { setPlayerLife(targetIdx, { alive: false }); } catch {}
                }
              }
            }
            f.draft.nightFreemasonAppliedByDay[dayKey] = rec;
            return true;
          } catch { return false; }
        }

        // Resolve all night effects from payload. Used by effect registry and nextFlowStep.
        // Order: Herbalist → Pro/Sniper/Ocean/Zodiac → Negotiator → Saul → Investigator → Sodagari → Soldier → Mafia → Constantine → SixthSense → Heir.
        // Constantine runs after Mafia/Pro so he can revive players who died this night (e.g. Leon shooting citizen).
        function resolveNightFromPayload(f, payload) {
          try {
            const draw = appState.draw;
            if (!payload || !draw || !draw.players) return false;
            const payload0 = { ...payload };
            const scenario0 = getDrawScenarioForFlow();
            // Witch (Kabo): ability reflects to target — override payload so target's ability applies to themselves.
            if (scenario0 === "kabo" && payload0.witchTarget != null && Number.isFinite(Number(payload0.witchTarget))) {
              const wt = parseInt(payload0.witchTarget, 10);
              const tgt = draw.players[wt];
              const role = (tgt && tgt.roleId) ? tgt.roleId : "citizen";
              if (role === "detective") payload0.detectiveQuery = wt;
              else if (role === "herbalist") payload0.herbalistPoison = wt;
              else if (role === "armorsmith") payload0.armorsmithArmor = wt;
            }
            const findIdxByRole = (roleIds) => {
              const ids = Array.isArray(roleIds) ? roleIds : [roleIds];
              for (let i = 0; i < (draw.players || []).length; i++) {
                const p = draw.players[i];
                if (!p) continue;
                if (ids.includes(p.roleId)) return i;
              }
              return null;
            };
            // Who is disabled this night? (Matador: disable lasts 24h = current night only; no carry-over to next night)
            let disabledIdx = null;
            if (scenario0 === "pedarkhande") {
              const matadorIdx = findIdxByRole(["matador"]);
              const matadorAlive = matadorIdx !== null && draw.players[matadorIdx] && draw.players[matadorIdx].alive !== false;
              const matadorV = payload0.matadorDisable;
              if (matadorAlive && matadorV !== null && matadorV !== undefined && Number.isFinite(Number(matadorV))) {
                const prevNightKey = String(Math.max(0, (f.day || 1) - 1));
                const prevNight = (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKey]) ? f.draft.nightActionsByNight[prevNightKey] : null;
                const prevMatadorV = (prevNight && prevNight.matadorDisable != null && Number.isFinite(Number(prevNight.matadorDisable))) ? parseInt(prevNight.matadorDisable, 10) : null;
                const sameAsPrev = prevMatadorV !== null && parseInt(matadorV, 10) === prevMatadorV;
                if (!sameAsPrev) disabledIdx = parseInt(matadorV, 10);
              }
            }
            if (disabledIdx === null && payload0.magicianDisable !== null && payload0.magicianDisable !== undefined && Number.isFinite(Number(payload0.magicianDisable))) {
              disabledIdx = parseInt(payload0.magicianDisable, 10);
            }
            const doctorIdx = findIdxByRole(["doctor", "watson"]);
            const lecterIdx = findIdxByRole(["doctorLecter"]);
            const detIdx = findIdxByRole(["detective"]);
            const proIdx = findIdxByRole(["professional", "leon"]);
            const bomberIdx = findIdxByRole(["bomber"]);
            const oceanIdx = findIdxByRole(["ocean"]);
            const zodiacIdx = findIdxByRole(["zodiac"]);
            const sniperIdx2 = findIdxByRole(["sniper"]);
            const kaneIdx = findIdxByRole(["citizenKane"]);
            const constantineIdx = findIdxByRole(["constantine"]);
            if (disabledIdx !== null) {
              if (doctorIdx !== null && disabledIdx === doctorIdx) payload0.doctorSave = null;
              if (lecterIdx !== null && disabledIdx === lecterIdx) payload0.lecterSave = null;
              if (detIdx !== null && disabledIdx === detIdx) payload0.detectiveQuery = null;
              if (proIdx !== null && disabledIdx === proIdx) payload0.professionalShot = null;
              if (bomberIdx !== null && disabledIdx === bomberIdx) { payload0.bombTarget = null; payload0.bombCode = null; }
              if (oceanIdx !== null && disabledIdx === oceanIdx) payload0.oceanWake = null;
              if (zodiacIdx !== null && disabledIdx === zodiacIdx) payload0.zodiacShot = null;
              if (sniperIdx2 !== null && disabledIdx === sniperIdx2) payload0.sniperShot = null;
              if (kaneIdx !== null && disabledIdx === kaneIdx) payload0.kaneMark = null;
              if (constantineIdx !== null && disabledIdx === constantineIdx) payload0.constantineRevive = null;
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              if (!f.draft.disabledByNight || typeof f.draft.disabledByNight !== "object") f.draft.disabledByNight = {};
              f.draft.disabledByNight[String(f.day)] = disabledIdx;
            }
            // Store detective result for Status Check (when detectiveQuery is set, including Witch override).
            try {
              if (payload0.detectiveQuery !== null && payload0.detectiveQuery !== undefined && Number.isFinite(Number(payload0.detectiveQuery))) {
                const tIdx = parseInt(payload0.detectiveQuery, 10);
                const tr = (draw.players[tIdx] && draw.players[tIdx].roleId) ? draw.players[tIdx].roleId : "citizen";
                const isMafia = (typeof detectiveInquiryIsMafia === "function") ? detectiveInquiryIsMafia(tr) : ((roles[tr] && roles[tr].teamFa === "مافیا"));
                if (!f.draft.detectiveResultByNight || typeof f.draft.detectiveResultByNight !== "object") f.draft.detectiveResultByNight = {};
                f.draft.detectiveResultByNight[String(f.day || 1)] = { target: tIdx, isMafia, at: flowRecordTimestamp() };
              }
            } catch {}
            try { applyNightNatashaFromPayload(f, payload0); } catch {}
            try { applyNightHerbalistFromPayload(f, payload0); } catch {}
            try { applyNightExecutionerFromPayload(f, payload0); } catch {}
            try { applyNightProfessionalFromPayload(f, payload0); } catch {}
            try { applyNightSniperFromPayload(f, payload0); } catch {}
            try { applyNightOceanFromPayload(f, payload0); } catch {}
            try { applyNightZodiacFromPayload(f, payload0); } catch {}
            try { applyNightNegotiatorFromPayload(f, payload0); } catch {}
            try { applyNightSaulBuyFromPayload(f, payload0); } catch {}
            try { applyNightKaboYakoozaFromPayload(f, payload0); } catch {}
            try { applyNightInvestigatorFromPayload(f, payload0); } catch {}
            try { applyNightSodagariFromPayload(f, payload0); } catch {}
            try { applyNightSoldierFromPayload(f, payload0); } catch {}
            try { applyNightMafiaFromPayload(f, payload0); } catch {}
            try { applyNightSheriffFromPayload(f, payload0); } catch {}
            try { applyNightFreemasonFromPayload(f, payload0); } catch {}
            try { applyNightConstantineFromPayload(f, payload0); } catch {}
            try { applyNightSixthSenseFromPayload(f, payload0); } catch {}
            try { applyHeirInheritanceFromPayload(f); } catch {}
            // Pedarkhande: Kane ability once per game. Consume only when marked player survives the night.
            // If marked player dies same night, ability is refunded (not wasted).
            try {
              if (scenario0 === "pedarkhande" && kaneIdx !== null) {
                const kaneMarkRaw = payload0.kaneMark;
                const kaneMarkIdx = (kaneMarkRaw !== null && kaneMarkRaw !== undefined && Number.isFinite(parseInt(kaneMarkRaw, 10))) ? parseInt(kaneMarkRaw, 10) : null;
                if (kaneMarkIdx !== null && kaneMarkIdx >= 0 && kaneMarkIdx < draw.players.length) {
                  const markedPlayer = draw.players[kaneMarkIdx];
                  const markedSurvived = markedPlayer && markedPlayer.alive !== false;
                  if (markedSurvived) {
                    if (!f.draft || typeof f.draft !== "object") f.draft = {};
                    f.draft.kaneAbilityUsed = true;
                    f.draft.kaneAbilityUsedOnNight = f.day || 1;
                  }
                }
              }
            } catch {}
            try { renderCast(); } catch {}
            try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
            try { saveState(appState); } catch {}
            return true;
          } catch {
            return false;
          }
        }

        // ── End-condition helpers ─────────────────────────────────────────────

        // Encodes a phase+day into a monotonically-increasing integer so we can
        // compare "before" vs "after" positions in the game timeline.
        function flowLogicalTime(phase, day) {
          if (phase === "intro_day")   return 0;
          if (phase === "intro_night") return 1;
          const d = Number(day) || 1;
          if (phase === "day")         return 2 + (d - 1) * 2;
          if (phase === "night")       return 2 + (d - 1) * 2 + 1;
          return 999999; // chaos, winner — always kept
        }

        // Remove events that belong to phases/days "after" the current position.
        // Called during back-navigation to keep the timeline accurate.
        // When on a night step, also prune night_actions for this night (resolution not yet committed).
        function pruneEventsForward(f) {
          try {
            const cutoff = flowLogicalTime(f.phase, f.day);
            const onNightStep = f.phase === "night" && (f.day || 1) >= 1;
            const currentNight = f.day || 1;
            f.events = (f.events || []).filter((ev) => {
              if (!ev) return false;
              if (onNightStep && ev.kind === "night_actions" && ev.phase === "night" && Number(ev.day) === currentNight) return false;
              return flowLogicalTime(ev.phase, ev.day) <= cutoff;
            });
          } catch {}
        }

        // After any phase transition, check alive-player counts and auto-redirect
        // to Chaos or Winner if a game-end condition is detected.
        // backPhase/backDay/backStep describe where we came from so the user can
        // press Prev to return there.
        function checkAndAutoNavigate(f, backPhase, backDay, backStep) {
          try {
            if (!["day", "night", "intro_day", "intro_night"].includes(f.phase)) return false;
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const alive = draw.players
              .map((p, i) => ({ p, i }))
              .filter(({ p }) => p && p.alive !== false);
            const scenario = getDrawScenarioForFlow();
            // For win-condition counting: Nostradamus (pedarkhande) and Zodiac (zodiac) always count as citizen.
            // Their chosen side / independent status affects winner announcement only, not game-over threshold.
            const getTeam = (p) => {
              if ((p && p.roleId) === "nostradamus" && scenario === "pedarkhande") return "شهر";
              if ((p && p.roleId) === "zodiac" && scenario === "zodiac") return "شهر";
              const r = roles[p && p.roleId];
              return r ? r.teamFa : "شهر";
            };
            const nMafia   = alive.filter(({ p }) => getTeam(p) === "مافیا").length;
            const nIndep   = alive.filter(({ p }) => getTeam(p) === "مستقل").length;
            const nCitizen = alive.filter(({ p }) => getTeam(p) === "شهر").length;
            const total    = alive.length;
            if (!f.draft || typeof f.draft !== "object") f.draft = {};
            if (scenario === "devil") {
              const saintLost = !!(f.draft.devilSaintExecutedByDay && Object.keys(f.draft.devilSaintExecutedByDay).some((k) => f.draft.devilSaintExecutedByDay[k]));
              if (saintLost) {
                return setDevilWinner(f, "mafia", backPhase, backDay, backStep);
              }
              const demonAlive = alive.some(({ p }) => p && isDevilRoleType(p.roleId, "demon"));
              if (!demonAlive) {
                return setDevilWinner(f, "citizens", backPhase, backDay, backStep);
              }
              if (total <= 2) {
                return setDevilWinner(f, "mafia", backPhase, backDay, backStep);
              }
              const mayorAlive = alive.some(({ p }) => p && p.roleId === "devilMayor");
              const noExecutionToday = !!(f.draft.devilNoExecutionByDay && f.draft.devilNoExecutionByDay[String(f.day || 1)]);
              if (total === 3 && mayorAlive && noExecutionToday) {
                return setDevilWinner(f, "citizens", backPhase, backDay, backStep);
              }
              return false;
            }
            const zodiacAlive = scenario === "zodiac" && alive.some(({ p }) => (p && p.roleId) === "zodiac");
            // Mafia win: mafia ≥ all non-mafia. Zodiac scenario: Mafia wins only when Zodiac is eliminated.
            if (nMafia > 0 && nMafia >= nCitizen + nIndep && !zodiacAlive) {
              f.draft.winnerBack      = { phase: backPhase, day: backDay, step: backStep };
              f.draft.winnerFromChaos = false;
              f.draft.winnerTeam      = "mafia";
              f.phase = "winner"; f.step = 0;
              return true;
            }
            // Citizens win: no mafia and no independents. Zodiac scenario: City wins only when Zodiac is eliminated.
            if (nMafia === 0 && nIndep === 0 && !zodiacAlive) {
              f.draft.winnerBack      = { phase: backPhase, day: backDay, step: backStep };
              f.draft.winnerFromChaos = false;
              f.draft.winnerTeam      = "citizens";
              f.phase = "winner"; f.step = 0;
              return true;
            }
            // Chaos: exactly 3 alive, no win condition yet
            if (total === 3) {
              f.draft.chaosBack = { phase: backPhase, day: backDay, step: backStep };
              f.phase = "chaos"; f.step = 0;
              return true;
            }
            return false;
          } catch { return false; }
        }

        function nextFlowStep() {
          const f = ensureFlow();
          const steps = getFlowSteps(f);
          const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
          if (f.step < steps.length - 1) {
            // Apply step-specific effects before advancing.
            if (curStep.id === "day_guns") {
              // Resolve pending gun shots now that we are leaving this step.
              try {
                const dayKey = String(f.day || 1);
                const d2 = f.draft || {};
                const rec = (d2.gunShotAppliedByDay && d2.gunShotAppliedByDay[dayKey]) || null;
                if (rec && Array.isArray(rec.shots) && rec.shots.length) {
                  const draw2 = appState.draw;
                  const prevNightKeyGs = String((f.day || 1) - 1);
                  const prevNightActionsGs = (f.draft.nightActionsByNight && f.draft.nightActionsByNight[prevNightKeyGs]) || null;
                  for (const shot of rec.shots) {
                    if (shot.type === "real" && shot.targetPrevAlive) {
                      try { setPlayerLife(shot.target, { alive: false, reason: "shot" }); } catch {}
                      // Researcher chain kill: if the shot target is Researcher, also kill their linked Mafia.
                      try {
                        if ((draw2.players[shot.target] || {}).roleId === "researcher") {
                          const linkedIdxRaw = prevNightActionsGs ? prevNightActionsGs.researcherLink : null;
                          const linkedIdx = (linkedIdxRaw !== null && linkedIdxRaw !== undefined && Number.isFinite(parseInt(linkedIdxRaw, 10))) ? parseInt(linkedIdxRaw, 10) : null;
                          if (linkedIdx !== null && draw2.players[linkedIdx]) {
                            const linkedRoleId = draw2.players[linkedIdx].roleId || "citizen";
                            const linkedTeamFa = (roles[linkedRoleId] && roles[linkedRoleId].teamFa) ? roles[linkedRoleId].teamFa : "شهر";
                            const scenarioGs = getDrawScenarioForFlow();
                            const chainApplies = scenarioGs === "bazras"
                              ? (linkedRoleId === "nato" || linkedRoleId === "swindler")
                              : (linkedTeamFa === "مافیا" && linkedRoleId !== "mafiaBoss");
                            if (chainApplies) {
                              const chainWasAlive = draw2.players[linkedIdx].alive !== false;
                              if (chainWasAlive) { try { setPlayerLife(linkedIdx, { alive: false, reason: "researcher_chain" }); } catch {} }
                              shot.chainKilled = linkedIdx;
                              shot.chainPrevAlive = chainWasAlive;
                            }
                          }
                        }
                      } catch {}
                    }
                    // Re-add gun_shot event (upserts by shooter, so no duplicates).
                    try { addFlowEvent("gun_shot", { shooter: shot.shooter, target: shot.target, type: shot.type }); } catch {}
                  }
                  rec.applied = true;
                  d2.gunShotAppliedByDay[dayKey] = rec;
                  f.draft = d2;
                  try { renderCast(); } catch {}
                }
              } catch {}
            }
            if (curStep.id === "day_gun_expiry") {
              applyGunExpiryForDay(f);
              try { renderCast(); } catch {}
            }
            if (curStep.id === "day_kane_reveal") {
              applyKaneRevealForDay(f);
              try { renderCast(); } catch {}
            }
            if (curStep.id && String(curStep.id).startsWith("day_end_card_") && curStep.id !== "day_end_card_pick") {
              applyEndCardActionForDay(f);
              try { renderCast(); } catch {}
            }
            // Pedarkhande: apply Saul Buy when leaving mafia step so Back→change selection→Next works.
            if (curStep.id === "devil_day_actions") {
              try {
                applyDevilDayActionsFromInputs(f);
                try { renderCast(); } catch {}
                try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
                if (checkAndAutoNavigate(f, f.phase, f.day, f.step)) {
                  saveState(appState);
                  showFlowTool();
                  return;
                }
              } catch {}
            }
            if (curStep.id === "night_mafia_team" && getDrawScenarioForFlow() === "pedarkhande") {
              try {
                const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
                const payload = ev && ev.data ? ev.data : (f.draft && f.draft.nightActionsByNight && f.draft.nightActionsByNight[String(f.day)]) || null;
                if (payload && String(payload.godfatherAction || "") === "saul_buy" && (payload.saulBuyTarget !== null && payload.saulBuyTarget !== undefined)) {
                  applyNightSaulBuyFromPayload(f, payload);
                  // Failed buy (non-citizen target): ability is still consumed permanently per design.
                  if (!f.draft.saulBuyUsed) {
                    f.draft.saulBuyUsed = true;
                    f.draft.saulBuyUsedOnNight = f.day || 1;
                  }
                  try { renderCast(); } catch {}
                }
              } catch {}
            }
            f.step++;
            saveState(appState);
            showFlowTool();
            return;
          }
          // phase transition
          if (f.phase === "winner") {
            // Terminal phase — Next does nothing.
            return;
          }
          if (f.phase === "chaos") {
            // Next on chaos: compute winner from picks and transition to winner phase.
            try {
              const draw = appState.draw;
              if (draw && draw.players) {
                const d2 = f.draft || {};
                const picks = d2.chaosPicks || {};
                const aIdxs = draw.players.map((p, i) => ({ p, i })).filter(({ p }) => p && p.alive !== false);
                const _nostSideChaos = (d2.nostradamusChosenSide === "mafia" || d2.nostradamusChosenSide === "citizen") ? d2.nostradamusChosenSide : null;
                const _scenarioChaos = getDrawScenarioForFlow();
                const getT = (p) => {
                  if ((p && p.roleId) === "nostradamus" && _nostSideChaos && _scenarioChaos === "pedarkhande") return _nostSideChaos === "mafia" ? "مافیا" : "شهر";
                  if ((p && p.roleId) === "zodiac" && _scenarioChaos === "zodiac") return "شهر";
                  const r = roles[p && p.roleId]; return r ? r.teamFa : "شهر";
                };
                const aMaf = aIdxs.filter(({ p }) => getT(p) === "مافیا");
                const aCit = aIdxs.filter(({ p }) => getT(p) === "شهر");
                const aInd = aIdxs.filter(({ p }) => getT(p) === "مستقل");
                let winner = null;
                if (aMaf.length === 1 && aCit.length === 2 && aInd.length === 0) {
                  const mafI = String(aMaf[0].i);
                  winner = aCit.some(({ i }) => String(picks[String(i)]) === mafI) ? "mafia" : "citizens";
                } else if (aMaf.length === 1 && aCit.length === 1 && aInd.length === 1) {
                  winner = String(picks[String(aCit[0].i)]) === String(aMaf[0].i) ? "mafia" : "independent";
                }
                if (winner) {
                  if (!f.draft) f.draft = {};
                  f.draft.winnerTeam = winner;
                  f.draft.winnerFromChaos = true;
                  f.phase = "winner";
                  f.step = 0;
                  saveState(appState);
                  showFlowTool();
                }
              }
            } catch {}
            return;
          }
          // Capture position BEFORE transition so back-nav can return here.
          const _prePhase = f.phase, _preDay = f.day, _preStep = f.step;
          // Sync status (alive/dead counts) at end of every phase — no dedicated step.
          try { if (typeof syncGodStatusFromPlayers === "function") syncGodStatusFromPlayers(); } catch {}
          if (f.phase === "intro_day") {
            f.phase = "intro_night";
            f.step = 0;  // Always start at first intro night step (Nostradamus for Pedarkhande)
          } else if (f.phase === "intro_night") {
            f.phase = "day";
            f.day = 1;
            f.step = 0;
          } else if (f.phase === "day") {
            // Apply end card action if we're on last step (end card) — it's not applied in the inner Next branch.
            const steps = getFlowSteps(f);
            const curStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
            if (curStep.id && String(curStep.id).startsWith("day_end_card_") && curStep.id !== "day_end_card_pick") {
              try { applyEndCardActionForDay(f); } catch {}
              try { renderCast(); } catch {}
            }
            // Snapshot day steps so back-nav from night lands on the correct last step (e.g. Face Off).
            try {
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              if (!f.draft.dayStepsByDay || typeof f.draft.dayStepsByDay !== "object") f.draft.dayStepsByDay = {};
              f.draft.dayStepsByDay[String(f.day)] = getFlowSteps(f).map((s) => s.id);
            } catch {}
            // Clear guns from the just-finished day — they were only valid for that day.
            f.guns = {};
            f.phase = "night";
            f.step = 0;
            // Kane auto-death (pedarkhande): if Kane successfully revealed a Mafia member this day,
            // he is eliminated at the end of the next night (تیر غیب). Godfather is not safe from Kane's reveal.
            try {
              if (getDrawScenarioForFlow() === "pedarkhande") {
                const draw = appState.draw;
                if (draw && draw.players) {
                  const dayKey = String(f.day || 1);
                  const kaneReveal = (f.draft && f.draft.kaneRevealAppliedByDay && f.draft.kaneRevealAppliedByDay[dayKey]) || null;
                  const hadKaneReveal = kaneReveal && kaneReveal.revealed === true && kaneReveal.idx != null;
                  if (hadKaneReveal) {
                    const kaneIdx = draw.players.findIndex((p) => p && p.roleId === "citizenKane");
                    if (kaneIdx !== -1 && draw.players[kaneIdx].alive !== false) {
                      setPlayerLife(kaneIdx, { alive: false, reason: "invisible_bullet" });
                      const draft = f.draft || {};
                      draft.kaneInvisibleBulletByNight = f.day || 1;
                      f.draft = draft;
                      try { renderCast(); } catch {}
                    }
                  }
                }
              }
            } catch {}
          } else {
            // Apply night resolution BEFORE moving to next day (via effect registry or fallback).
            try {
              const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
              const payload0 = ev && ev.data ? { ...ev.data } : null;
              if (payload0) {
                if (typeof applyEffect === "function" && typeof hasEffect === "function" && hasEffect("night_resolution")) {
                  applyEffect("night_resolution", { f, payload: payload0 });
                } else {
                  resolveNightFromPayload(f, payload0);
                }
              }
            } catch {}
            // Bomb is planted at night and becomes active on the NEXT day.
            try {
              const ev = (f.events || []).slice().reverse().find((e) => e && e.kind === "night_actions" && e.phase === "night" && e.day === f.day && e.data);
              const payload = ev && ev.data ? ev.data : null;
              const planted = !!(payload && payload.bombTarget !== null && payload.bombTarget !== undefined && Number.isFinite(Number(payload.bombTarget)));
              f.bombActive = planted;
              if (planted) {
                if (!f.draft || typeof f.draft !== "object") f.draft = {};
                if (!f.draft.bombByDay || typeof f.draft.bombByDay !== "object") f.draft.bombByDay = {};
                const nextDay = Math.max(1, (f.day || 1) + 1);
                const target = parseInt(payload.bombTarget, 10);
                const code = (payload.bombCode != null) ? String(payload.bombCode).trim() : "";
                f.draft.bombByDay[String(nextDay)] = {
                  target: Number.isFinite(target) ? target : null,
                  code: code || null,
                  plantedNight: Number(f.day || 1),
                  at: flowRecordTimestamp(),
                };
              }
            } catch {}
            // night -> next day
            f.phase = "day";
            f.day = Math.max(1, (f.day || 1) + 1);
            f.step = 0;
            // Snapshot the step list for this day so mid-day deaths (e.g. bomb kills gun-holder)
            // cannot remove steps that were valid at day start.
            try {
              if (!f.draft || typeof f.draft !== "object") f.draft = {};
              if (!f.draft.dayStepsByDay || typeof f.draft.dayStepsByDay !== "object") f.draft.dayStepsByDay = {};
              f.draft.dayStepsByDay[String(f.day)] = getFlowSteps(f).map((s) => s.id);
            } catch {}
          }
          // After phase transition: auto-redirect to Chaos/Winner if conditions are met.
          checkAndAutoNavigate(f, _prePhase, _preDay, _preStep);
          saveState(appState);
          showFlowTool();
        }

        function prevFlowStep() {
          const f = ensureFlow();
          // No previous step at the very start of the flow.
          if (f.phase === "intro_day" && (f.step || 0) === 0) return;
          if (f.step > 0) {
            const steps = getFlowSteps(f);
            const leavingStep = steps[Math.min(steps.length - 1, Math.max(0, f.step || 0))] || {};
            const enteringStep = (f.step || 0) > 0 ? (steps[Math.max(0, (f.step || 0) - 1)] || {}) : {};
            // Revert deaths applied by certain steps when going backward.
            // Each step now applies deaths only on Next (deferred), so we revert either when:
            //   (a) leaving that step going backward, OR
            //   (b) entering that step from a later step going backward.
            if (leavingStep.id === "devil_day_actions" || enteringStep.id === "devil_day_actions") {
              try { revertDevilDayActionsForDay(f, f.day || 1); } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_elim" || leavingStep.id === "namayande_vote") {
              // Revert via effect registry (or fallback to direct call if registry not loaded)
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect(leavingStep.id)) {
                  revertEffect(leavingStep.id, { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              // Do NOT clear challengeUsedByDay — challenge selections are part of day_vote state and should persist when navigating back.
              // Return end card to pool when reverting elimination (cards cannot be reused in same game).
              try {
                const ec = appState.god && appState.god.endCards;
                if (ec && ec.byDay && ec.used && Array.isArray(ec.used)) {
                  const dayKey = String(f.day || 1);
                  const rec = ec.byDay[dayKey] && typeof ec.byDay[dayKey] === "object" ? ec.byDay[dayKey] : null;
                  if (rec && rec.cardId) {
                    const idx = ec.used.indexOf(rec.cardId);
                    if (idx >= 0) ec.used.splice(idx, 1);
                    delete ec.byDay[dayKey];
                  }
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_end_card_pick") {
              // Going back from the card-pick step — preserve card selection (selections must survive back-nav).
              // byDay[dayKey] is only cleared when reverting day_elim (going back past day_elim → day_vote).
              try { renderCast(); } catch {}
            } else if (leavingStep.id && String(leavingStep.id).startsWith("day_end_card_")) {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_end_card_action")) {
                  revertEffect("day_end_card_action", { f });
                } else {
                  revertEndCardActionForDay(f);
                }
              } catch {}
              // Do NOT clear card selection — preserve it so the pick step shows the selection still highlighted.
              // byDay[dayKey] is only cleared when reverting day_elim (going back past day_elim → day_vote).
              // Clear day step snapshot so steps are recomputed.
              try {
                if (f.draft && f.draft.dayStepsByDay && typeof f.draft.dayStepsByDay === "object") {
                  delete f.draft.dayStepsByDay[String(f.day)];
                }
              } catch {}
              // Do NOT clear endCardActionByDay — selection should persist when navigating back (see day_vote/challengeUsedByDay).
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "kabo_shoot" || enteringStep.id === "kabo_shoot") {
              // kabo_shoot applies death on Next. Revert via effect registry.
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("kabo_shoot")) {
                  revertEffect("kabo_shoot", { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "bazras_forced_vote" || enteringStep.id === "bazras_forced_vote") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("bazras_forced_vote")) {
                  revertEffect("bazras_forced_vote", { f });
                } else {
                  const d = f.draft || {};
                  const dayKey = String(f.day || 1);
                  const rec = (d.bazrasInterrogationByDay && d.bazrasInterrogationByDay[dayKey]) || {};
                  applyBazrasInterrogationFromPayload(f, { decision: rec.decision || null, outcome: null });
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_gun_expiry") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_gun_expiry")) {
                  revertEffect("day_gun_expiry", { f });
                } else {
                  revertGunExpiryForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (leavingStep.id === "day_guns" || enteringStep.id === "day_guns") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_guns")) {
                  revertEffect("day_guns", { f });
                } else {
                  revertGunShotsForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (enteringStep.id === "day_kane_reveal") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_kane_reveal")) {
                  revertEffect("day_kane_reveal", { f });
                } else {
                  revertKaneRevealForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (enteringStep.id && String(enteringStep.id).startsWith("day_end_card_") && enteringStep.id !== "day_end_card_pick") {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_end_card_action")) {
                  revertEffect("day_end_card_action", { f });
                } else {
                  revertEndCardActionForDay(f);
                }
              } catch {}
              try { renderCast(); } catch {}
            } else if (enteringStep.id === "night_mafia_team" && getDrawScenarioForFlow() === "pedarkhande") {
              // Revert Saul Buy when going Back to mafia step (it was applied when leaving mafia step).
              // Trigger when entering mafia from any later night step (Watson, Leon, Kane, Constantine).
              try {
                const dayKey = String(f.day || 1);
                const d = f.draft || {};
                if (d.nightSaulBuyAppliedByDay && d.nightSaulBuyAppliedByDay[dayKey]) {
                  const rec = d.nightSaulBuyAppliedByDay[dayKey];
                  if (Number.isFinite(Number(rec.converted)) && rec.prevRoleId !== null) {
                    const p = appState.draw && appState.draw.players && appState.draw.players[parseInt(rec.converted, 10)];
                    if (p) p.roleId = rec.prevRoleId;
                  }
                  d.nightSaulBuyAppliedByDay[dayKey] = { converted: null, prevRoleId: null };
                }
                if (d.saulBuyUsedOnNight != null && Number(d.saulBuyUsedOnNight) === Number(dayKey)) {
                  d.saulBuyUsed = false;
                  d.saulBuyUsedOnNight = null;
                }
                try { renderCast(); } catch {}
              } catch {}
            }
            // When entering day_vote or namayande_defense from day_elim/namayande_vote, ensure vote-out is reverted
            // so the voted-out player appears in the select-defenders list (user-reported bug).
            if (enteringStep.id === "day_vote" || enteringStep.id === "namayande_defense") {
              try {
                const elimId = (leavingStep.id === "namayande_vote") ? "namayande_vote" : "day_elim";
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect(elimId)) {
                  revertEffect(elimId, { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              try { renderCast(); } catch {}
            }
            f.step--;
            try { pruneEventsForward(f); } catch {}
            saveState(appState);
            showFlowTool();
            return;
          }
          // go back to previous phase end
          if (f.phase === "winner") {
            if (f.draft && f.draft.winnerFromChaos) {
              f.phase = "chaos";
              f.step = 0;
            } else if (f.draft && f.draft.winnerBack) {
              const bk = f.draft.winnerBack;
              f.phase = bk.phase; f.day = bk.day; f.step = bk.step;
              try {
                const restoredSteps = getFlowSteps(f);
                const restoredStep = restoredSteps[Math.min(restoredSteps.length - 1, Math.max(0, f.step || 0))] || {};
                if (restoredStep.id === "devil_day_actions") {
                  revertDevilDayActionsForDay(f, f.day || 1);
                  try { renderCast(); } catch {}
                }
              } catch {}
            } else {
              f.phase = "day"; f.step = 0;
            }
            try { pruneEventsForward(f); } catch {}
            saveState(appState); showFlowTool(); return;
          }
          if (f.phase === "chaos") {
            if (f.draft && f.draft.chaosBack) {
              const bk = f.draft.chaosBack;
              f.phase = bk.phase; f.day = bk.day; f.step = bk.step;
            } else {
              f.phase = "day"; f.step = 0;
            }
            try { pruneEventsForward(f); } catch {}
            saveState(appState); showFlowTool(); return;
          }
          if (f.phase === "intro_night") {
            f.phase = "intro_day";
            f.step = 0;
            try { pruneEventsForward(f); } catch {}
            saveState(appState);
            showFlowTool();
            return;
          }
          if (f.phase === "night") {
            // Night → last day step. Use snapshot from day→night transition when available,
            // else compute steps (before any revert) so we land on the correct step
            // (e.g. Face Off, not day_elim, when the last step was an end card).
            const dayKey = String(f.day || 1);
            const snapshotIds = (f.draft && f.draft.dayStepsByDay && Array.isArray(f.draft.dayStepsByDay[dayKey]))
              ? f.draft.dayStepsByDay[dayKey] : null;
            const daySteps = snapshotIds && snapshotIds.length
              ? snapshotIds.map((id) => ({ id, title: id }))
              : getFlowSteps({ ...f, phase: "day" });
            const lastDayStepId = daySteps.length > 0 ? (daySteps[daySteps.length - 1] || {}).id : "";
            const lastStepIsEndCard = lastDayStepId && String(lastDayStepId).startsWith("day_end_card_") && lastDayStepId !== "day_end_card_pick";
            f.phase = "day";
            f.step = Math.max(0, daySteps.length - 1);
            // Only revert day_elim when landing on day_elim (not when landing on end card step).
            if (!lastStepIsEndCard) {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_elim")) {
                  revertEffect("day_elim", { f });
                } else {
                  applyDayElimFromPayload(f, { out: null });
                }
              } catch {}
              try {
                const ec = appState.god && appState.god.endCards;
                if (ec && ec.byDay && ec.used && Array.isArray(ec.used)) {
                  const dayKey = String(f.day || 1);
                  const rec = ec.byDay[dayKey] && typeof ec.byDay[dayKey] === "object" ? ec.byDay[dayKey] : null;
                  if (rec && rec.cardId) {
                    const idx = ec.used.indexOf(rec.cardId);
                    if (idx >= 0) ec.used.splice(idx, 1);
                    delete ec.byDay[dayKey];
                  }
                }
              } catch {}
            } else {
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_end_card_action")) {
                  revertEffect("day_end_card_action", { f });
                } else {
                  revertEndCardActionForDay(f);
                }
              } catch {}
            }
            try { renderCast(); } catch {}
            // Restore f.guns from this day's night gives (night N-1 gave guns for day N).
            try {
              const d = f.draft || {};
              const prevNightKey = String((f.day || 1) - 1);
              const nightGives = Array.isArray(d.nightGunGivesByNight && d.nightGunGivesByNight[prevNightKey])
                ? d.nightGunGivesByNight[prevNightKey] : [];
              const shotRec = (d.gunShotAppliedByDay && d.gunShotAppliedByDay[String(f.day)]) || null;
              // Only mark guns as used if the shots were actually applied (not reverted).
              const usedShooters = (shotRec && shotRec.applied && Array.isArray(shotRec.shots))
                ? new Set(shotRec.shots.filter((s) => s).map((s) => parseInt(s.shooter, 10)))
                : new Set();
              f.guns = {};
              for (const g of nightGives) {
                const to = parseInt(g.to, 10);
                if (!Number.isFinite(to)) continue;
                f.guns[to] = { type: g.type || "real", used: usedShooters.has(to), givenAt: g.at || 0 };
              }
            } catch {}
          } else {
            // Day step 0 → previous night's last step.
            if ((f.day || 1) > 1) {
              // Revert day effects applied at step 0 (e.g. Kane reveal) before reverting night.
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("day_kane_reveal")) {
                  revertEffect("day_kane_reveal", { f });
                } else {
                  revertKaneRevealForDay(f);
                }
              } catch {}
              // Clear the day step snapshot for this day — it will be recomputed on next forward.
              try {
                if (f.draft && f.draft.dayStepsByDay && typeof f.draft.dayStepsByDay === "object") {
                  delete f.draft.dayStepsByDay[String(f.day)];
                }
              } catch {}
              // Revert all deaths that were applied when that night transitioned to this day.
              const prevNight = (f.day || 1) - 1;
              try {
                if (typeof revertEffect === "function" && typeof hasEffect === "function" && hasEffect("night_resolution")) {
                  revertEffect("night_resolution", { f, nightDayNum: prevNight });
                } else {
                  revertNightDeaths(f, prevNight);
                }
              } catch {}
              try { renderCast(); } catch {}
              f.day = Math.max(1, f.day - 1);
              f.phase = "night";
              f.step = Math.max(0, getFlowSteps({ ...f, phase: "night" }).length - 1);
            } else {
              // Day 1 step 0 → go back to intro_night (last step).
              f.phase = "intro_night";
              const introSteps = getFlowSteps({ ...f, phase: "intro_night" });
              f.step = Math.max(0, introSteps.length - 1);
            }
          }
          try { pruneEventsForward(f); } catch {}
          try { if (typeof syncGodStatusFromPlayers === "function") syncGodStatusFromPlayers(); } catch {}
          saveState(appState);
          showFlowTool();
        }

        function resetFlow() {
          if (!appState.god) appState.god = {};
          appState.god.flow = null;
          saveState(appState);
          showFlowTool();
        }

        function applyBombResultFromForm() {
          try {
            const f = ensureFlow();
            const draw = appState.draw;
            if (!draw || !draw.players) return false;
            const d = f.draft || {};
            if (!d.bombByDay || typeof d.bombByDay !== "object") d.bombByDay = {};
            if (!d.bombResolveByDay || typeof d.bombResolveByDay !== "object") d.bombResolveByDay = {};
            const rec = d.bombByDay[String(f.day)] || null;
            const targetIdx = (rec && rec.target !== null && rec.target !== undefined && Number.isFinite(Number(rec.target))) ? parseInt(rec.target, 10) : null;
            const code = (rec && rec.code != null) ? String(rec.code).trim() : "";
            const guardIdx = (() => {
              try {
                // Pending real-gun shots in this day phase (deaths not yet committed).
                const dayKey = String(f.day || 1);
                const pendingRec = (d.gunShotAppliedByDay && d.gunShotAppliedByDay[dayKey]) || null;
                const pendingDeadIdxs = new Set(
                  (pendingRec && Array.isArray(pendingRec.shots))
                    ? pendingRec.shots.filter((s) => s && s.type === "real" && s.targetPrevAlive).map((s) => s.target)
                    : []
                );
                for (let i = 0; i < (draw.players || []).length; i++) {
                  const p = draw.players[i];
                  if (!p) continue;
                  const rid = p.roleId || "citizen";
                  if (roles[rid] && roles[rid].canSacrificeForBomb && p.alive !== false && !pendingDeadIdxs.has(i)) return i;
                }
              } catch {}
              return null;
            })();
            const guardDisabledPrevNight = (guardIdx !== null && d.disabledByNight && d.disabledByNight[String(f.day)] != null)
              ? (parseInt(d.disabledByNight[String(f.day)], 10) === guardIdx) : false;
            const guardSac = !!(document.getElementById("fl_bomb_guard") && document.getElementById("fl_bomb_guard").checked && guardIdx !== null && !guardDisabledPrevNight);
            const guardGuess = String(((document.getElementById("fl_bomb_guard_guess") || {}).value) || "").trim();
            const targetGuess = String(((document.getElementById("fl_bomb_target_guess") || {}).value) || "").trim();
            const guess = guardSac ? guardGuess : targetGuess;
            if (!code || targetIdx === null || guess === "") return false;
            const ok = (guess === code);
            let outcome = null;
            let killed = null;
            if (guardSac) {
              outcome = ok ? "neutralized_guard" : "guard_died";
              killed = ok ? null : guardIdx;
            } else {
              outcome = ok ? "neutralized_target" : "target_died";
              killed = ok ? null : targetIdx;
            }
            try {
              if (!d.bombAppliedByDay || typeof d.bombAppliedByDay !== "object") d.bombAppliedByDay = {};
              const key = String(f.day || 1);
              const prev = (d.bombAppliedByDay[key] && typeof d.bombAppliedByDay[key] === "object")
                ? d.bombAppliedByDay[key]
                : { killed: null, prevAlive: null };
              const desired = (killed !== null && Number.isFinite(Number(killed))) ? parseInt(killed, 10) : null;
              if (prev.killed !== null && Number.isFinite(Number(prev.killed))) {
                const pi = parseInt(prev.killed, 10);
                if (prev.prevAlive === true) {
                  try { setPlayerLife(pi, { alive: true }); } catch {}
                }
              }
              if (desired !== null) {
                const p = draw.players[desired];
                const wasAlive = p ? (p.alive !== false) : null;
                if (wasAlive) {
                  try { setPlayerLife(desired, { alive: false, reason: "bomb" }); } catch {}
                }
                prev.killed = desired;
                prev.prevAlive = wasAlive === true;
              } else {
                prev.killed = null;
                prev.prevAlive = null;
              }
              d.bombAppliedByDay[key] = prev;
            } catch {}
            d.bombResolveByDay[String(f.day)] = { guardSacrifice: guardSac, guardGuess, targetGuess, resolved: true, outcome, ok, killed, at: flowRecordTimestamp() };
            f.draft = d;
            f.bombActive = false;
            addFlowEvent("bomb_resolve", { day: f.day, target: targetIdx, code, guardSacrifice: guardSac, guess, ok, killed, outcome });
            saveState(appState);
            try { renderCast(); } catch {}
            try { if (typeof renderNameGrid === "function") renderNameGrid(); } catch {}
            return true;
          } catch {
            return false;
          }
        }

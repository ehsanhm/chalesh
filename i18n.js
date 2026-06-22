        function toFarsiNum(n) {
          return String(n).replace(/[0-9]/g, (d) => "۰۱۲۳۴۵۶۷۸۹"[parseInt(d, 10)]);
        }
        window.toFarsiNum = toFarsiNum;
        function t(key, vars) {
          const dict = STR[appLang] || STR.fa;
          let s = (dict && dict[key]) || (STR.fa && STR.fa[key]) || key;
          if (vars && typeof vars === "object") {
            for (const k of Object.keys(vars)) {
              let v = vars[k];
              if (appLang === "fa" && (typeof v === "number" || (typeof v === "string" && /^\d+$/.test(v)))) {
                v = toFarsiNum(v);
              } else {
                v = String(v);
              }
              s = s.replaceAll("{" + k + "}", v);
            }
          }
          return s;
        }
        function updateDocTitle() {
          try {
            const castVisible = $("castCard") && !$("castCard").classList.contains("hidden");
            let full;
            if (castVisible) {
              const sel = $("scenario");
              const scenarioKey = (sel && sel.value) || (typeof appState !== "undefined" && appState.ui && appState.ui.scenario) || "";
              const cfg = (typeof SCENARIO_CONFIGS !== "undefined") && SCENARIO_CONFIGS[scenarioKey];
              const scenarioName = cfg ? (appLang === "fa" ? cfg.name.fa : cfg.name.en) : "";
              const prefix = appLang === "fa" ? "مافیا" : "Mafia";
              full = scenarioName ? `${prefix}: ${scenarioName}` : t("app.title");
            } else {
              full = t("app.title");
            }
            document.title = full;
            const titleEl = $("appTitle");
            if (titleEl) titleEl.textContent = full;
          } catch {}
        }
        function applyStaticI18n() {
          try { updateDocTitle(); } catch {}
          document.querySelectorAll("[data-i18n]").forEach((el) => {
            const key = el.getAttribute("data-i18n");
            if (!key) return;
            el.textContent = t(key);
          });
          document.querySelectorAll("[data-i18n-title]").forEach((el) => {
            const key = el.getAttribute("data-i18n-title");
            if (!key) return;
            el.setAttribute("title", t(key));
          });
          document.querySelectorAll("[data-i18n-aria-label]").forEach((el) => {
            const key = el.getAttribute("data-i18n-aria-label");
            if (!key) return;
            el.setAttribute("aria-label", t(key));
          });
        }
        function applyScenarioOptionLabels() {
          const sel = $("scenario");
          if (!sel || !sel.options) return;
          for (const opt of Array.from(sel.options)) {
            const cfg = SCENARIO_CONFIGS[opt.value];
            if (!cfg) continue;
            opt.textContent = appLang === "fa" ? cfg.name.fa : cfg.name.en;
          }
        }
        function updateLangChip() {
          const chip = $("langChip");
          const label = $("langLabel");
          if (chip) chip.setAttribute("aria-label", t("top.lang.aria"));
          if (label) label.textContent = (appLang === "fa") ? t("top.lang.toEn") : t("top.lang.toFa");
        }
        function setLanguage(lang) {
          appLang = (lang === "en") ? "en" : "fa";
          try { if (shouldPersist()) localStorage.setItem(LANG_KEY, appLang); } catch {}
          try {
            const root = document.documentElement;
            root.setAttribute("lang", appLang === "fa" ? "fa" : "en");
            root.setAttribute("dir", appLang === "fa" ? "rtl" : "ltr");
          } catch {}
          applyScenarioOptionLabels();
          applyStaticI18n();
          updateLangChip();
          try { if (typeof renderToggles === "function") renderToggles(); } catch {}
          try { if (typeof applyUIFromState === "function") applyUIFromState(); } catch {}
          try { if (typeof updateQuickStat === "function") updateQuickStat(); } catch {}
          try { if (typeof renderCards === "function" && $("cardsCard") && !$("cardsCard").classList.contains("hidden")) renderCards(); } catch {}
          try { if (typeof renderCast === "function" && $("castCard") && !$("castCard").classList.contains("hidden")) renderCast(); } catch {}
          try { if (typeof renderNameGrid === "function" && $("playersCard") && !$("playersCard").classList.contains("hidden")) renderNameGrid(); } catch {}
          try { if (typeof closeToolModal === "function") closeToolModal(); } catch {}
          try { if (typeof closeModal === "function") closeModal(); } catch {}
        }
        function toggleLanguage() {
          setLanguage(appLang === "fa" ? "en" : "fa");
        }

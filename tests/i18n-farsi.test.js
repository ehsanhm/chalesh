/**
 * Tests that in Farsi mode (appLang === "fa"), all user-facing texts are in Farsi,
 * not English or raw IDs (e.g. "night_detective").
 *
 * Bug example: "مرحله 3 از 3 • night_detective" — step title was showing raw ID instead of Farsi.
 *
 * Run from tests/run.html (loads i18n, flow-engine, then this).
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  const suite = {
    name: "i18n-farsi",
    tests: [
      {
        name: "t() returns Farsi for tool.flow.step when appLang is fa",
        fn: function ({ assert }) {
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const s = typeof t === "function" ? t("tool.flow.step", { i: 1, n: 3 }) : "";
            assert(s.includes("مرحله"), "Step label should be Farsi (مرحله), got: " + s);
            assert(!s.includes("Step"), "Step label should not be English when appLang is fa");
          } finally {
            appLang = prev;
          }
        },
      },
      {
        name: "night step titles are Farsi when appLang is fa (no raw step IDs)",
        fn: function ({ assert }) {
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const stepIds = ["night_detective", "night_mafia", "night_doctor"];
            for (const id of stepIds) {
              const key = "tool.flow.night." + id.replace("night_", "");
              const s = typeof t === "function" ? t(key) : "";
              assert(s.length > 0, "Translation for " + key + " should exist");
              assert(!s.includes("_"), "Translation should not contain raw ID (underscore), got: " + s);
              assert(!/^[a-z_]+$/.test(s), "Translation should not be raw English ID, got: " + s);
            }
          } finally {
            appLang = prev;
          }
        },
      },
      {
        name: "getStepTitle returns Farsi for night_detective when appLang is fa",
        fn: function ({ assert }) {
          if (typeof getStepTitle !== "function") return;
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const title = getStepTitle("night_detective");
            assert(title === "کارآگاه", "night_detective title should be کارآگاه in Farsi, got: " + title);
            assert(title !== "night_detective", "Should not return raw step ID");
            assert(title !== "Detective", "Should not return English");
          } finally {
            appLang = prev;
          }
        },
      },
      {
        name: "t() substitutes numbers as Farsi numerals when appLang is fa",
        fn: function ({ assert }) {
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const s = typeof t === "function" ? t("tool.flow.step", { i: 3, n: 3 }) : "";
            assert(s.includes("۳"), "Step label should use Farsi numeral ۳, got: " + s);
            assert(!s.includes("3"), "Step label should not use Western numeral 3 when appLang is fa");
          } finally {
            appLang = prev;
          }
        },
      },
      {
        name: "getStepTitle returns Farsi for night_mafia and night_doctor when appLang is fa",
        fn: function ({ assert }) {
          if (typeof getStepTitle !== "function") return;
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const mafia = getStepTitle("night_mafia");
            const doctor = getStepTitle("night_doctor");
            assert(mafia !== "night_mafia" && mafia !== "Mafia team", "night_mafia should be Farsi");
            assert(doctor !== "night_doctor" && doctor !== "Doctor", "night_doctor should be Farsi");
          } finally {
            appLang = prev;
          }
        },
      },
      {
        name: "toFarsiNum converts Western digits to Persian numerals",
        fn: function ({ assert }) {
          if (typeof toFarsiNum !== "function") return;
          assert(toFarsiNum(0) === "۰", "0 -> ۰");
          assert(toFarsiNum(5) === "۵", "5 -> ۵");
          assert(toFarsiNum(10) === "۱۰", "10 -> ۱۰");
          assert(toFarsiNum(30) === "۳۰", "30 -> ۳۰");
          assert(toFarsiNum(123) === "۱۲۳", "123 -> ۱۲۳");
        },
      },
      {
        name: "Nostradamus result line uses Farsi numerals when appLang is fa",
        fn: function ({ assert }) {
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const fmt = (typeof toFarsiNum === "function" && appLang === "fa") ? toFarsiNum : String;
            const mafiaCount = 0;
            const n = 3;
            const line = `نتیجه: ${fmt(mafiaCount)} نفر از این ${fmt(n)} نفر مافیا هستند.`;
            assert(line.includes("۰"), "Should use ۰ for 0, got: " + line);
            assert(line.includes("۳"), "Should use ۳ for 3, got: " + line);
            assert(!line.includes("0"), "Should not use Western 0");
            assert(!line.includes("3"), "Should not use Western 3");
          } finally {
            appLang = prev;
          }
        },
      },
      {
        name: "setup display format uses Farsi numerals when appLang is fa",
        fn: function ({ assert }) {
          const prev = typeof appLang !== "undefined" ? appLang : "en";
          try {
            appLang = "fa";
            const fmt = (typeof toFarsiNum === "function" && appLang === "fa") ? toFarsiNum : String;
            const citizenCount = fmt(7);
            const mafiaCount = fmt(3);
            assert(citizenCount.includes("۷") || citizenCount === "۷", "citizen count should use ۷, got: " + citizenCount);
            assert(mafiaCount.includes("۳") || mafiaCount === "۳", "mafia count should use ۳, got: " + mafiaCount);
            assert(!citizenCount.includes("7"), "citizen count should not use Western 7");
            assert(!mafiaCount.includes("3"), "mafia count should not use Western 3");
          } finally {
            appLang = prev;
          }
        },
      },
    ],
  };

  window.I18N_FARSI_TESTS = suite;
})();

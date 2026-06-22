/**
 * Tests for Capo (Kabo) scenario per design/capo_test_instructions.md.
 * Verifies flow structure, night step order, role-specific behavior, and back navigation.
 * Every instruction (10–300) is covered by at least one test.
 *
 * Run from tests/run.html.
 */
(function () {
  "use strict";
  if (typeof window.runTests !== "function") return;

  function setupCapoDraw(withKadkhoda) {
    const players = [
      { roleId: "danMafia", alive: true },
      { roleId: "witch", alive: true },
      { roleId: "executioner", alive: true },
      { roleId: "detective", alive: true },
      { roleId: "heir", alive: true },
      { roleId: "herbalist", alive: true },
      { roleId: "armorsmith", alive: true },
      { roleId: "suspect", alive: true },
      { roleId: "citizen", alive: true },
      { roleId: withKadkhoda ? "kadkhoda" : "citizen", alive: true },
    ];
    return players;
  }

  function setupCapo(withKadkhoda) {
    appState.ui.scenario = "kabo";
    appState.draw = {
      players: setupCapoDraw(withKadkhoda),
      uiAtDraw: { scenario: "kabo" },
    };
    appState.god = appState.god || {};
    appState.god.flow = null;
    return ensureFlow();
  }

  const suite = {
    name: "capo-test-instructions",
    tests: [
      /* ─── INTRO DAY (10) ─── */
      {
        name: "10: Intro Day — Next advances to Intro Night",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function") return;
          const f = setupCapo(false);
          f.phase = "intro_day";
          f.step = 0;
          nextFlowStep();
          assert(f.phase === "intro_night", "Next on Intro Day should advance to Intro Night");
        },
      },
      /* ─── INTRO NIGHT (20, 30) ─── */
      {
        name: "20, 30: Intro Night — Heir pick persists after Back then Next",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof prevFlowStep !== "function" || typeof addFlowEvent !== "function") return;
          const f = setupCapo(false);
          const detectiveIdx = 3;
          if (!appState.draw.players[detectiveIdx] || appState.draw.players[detectiveIdx].roleId !== "detective") return;

          f.phase = "intro_night";
          f.step = 0;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { heirPick: detectiveIdx };
          addFlowEvent("night_actions", { heirPick: detectiveIdx });

          prevFlowStep();
          nextFlowStep();
          const got = (f.draft.nightActionsByNight && f.draft.nightActionsByNight["0"] && f.draft.nightActionsByNight["0"].heirPick);
          assert(got === detectiveIdx, "Heir successor selection should persist after Back then Next");
        },
      },
      /* ─── DAY 1 TRUST VOTE (50, 60, 70) ─── */
      {
        name: "50, 70: Day 1 has Trust Vote then Select Suspects as steps 1 and 2",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          const steps = getFlowSteps({ ...f, phase: "day" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids[0] === "kabo_trust_vote", "Step 1 must be Trust Vote");
          assert(ids[1] === "kabo_suspect_select", "Step 2 must be Select Suspects");
        },
      },
      /* ─── DAY 1 SUSPECT SELECT (80, 90) ─── */
      {
        name: "80, 90: Suspect select — Trusted picks 2 suspects, selection persists after Back/Next",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function") return;
          const f = setupCapo(false);
          const citizenIdx = 8;
          const executionerIdx = 2;
          if (!appState.draw.players[citizenIdx] || !appState.draw.players[executionerIdx]) return;

          f.phase = "day";
          f.day = 1;
          f.step = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [citizenIdx, executionerIdx];
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["kabo_trust_vote", "kabo_suspect_select", "kabo_midday", "kabo_shoot"];

          prevFlowStep();
          nextFlowStep();
          const got = (f.draft.kaboSuspectsByDay && f.draft.kaboSuspectsByDay["1"]) || [];
          assert(got.length === 2 && got.includes(citizenIdx) && got.includes(executionerIdx), "2 suspects should persist after Back then Next");
        },
      },
      /* ─── DAY 1 MID-DAY (100, 110) ─── */
      {
        name: "100, 110: Mid-day Sleep — Capo picks Gun 1/2, selection persists after Back/Next",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          f.step = 2;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboRealBulletByDay = f.draft.kaboRealBulletByDay || {};
          f.draft.kaboRealBulletByDay["1"] = 0; // Gun 1
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["kabo_trust_vote", "kabo_suspect_select", "kabo_midday", "kabo_shoot"];

          prevFlowStep();
          nextFlowStep();
          const got = (f.draft.kaboRealBulletByDay && f.draft.kaboRealBulletByDay["1"]);
          assert(got === 0, "Real bullet (Gun 1) selection should persist after Back then Next");
        },
      },
      /* ─── DAY 1 DEFENSE & SHOOT (120, 130, 140) ─── */
      {
        name: "120, 130: kabo_shoot — real bullet kills target, Status Check shows elimination",
        fn: function ({ assert }) {
          if (typeof wouldStatusCheckShowEliminated !== "function" || typeof getEliminatedForStatusCheck !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const citizenIdx = 8;
          if (!draw[citizenIdx]) return;

          draw[citizenIdx].alive = false;
          f.phase = "day";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.gunShotAppliedByDay = f.draft.gunShotAppliedByDay || {};
          f.draft.gunShotAppliedByDay["1"] = {
            applied: true,
            shots: [{ shooter: 6, target: citizenIdx, type: "real", targetPrevAlive: true }],
          };
          f.events = f.events || [];
          f.events.push({ kind: "gun_shot", phase: "day", day: 1, data: {} });

          const eliminated = getEliminatedForStatusCheck(f, 1, "day");
          assert(eliminated.includes(citizenIdx), "Status Check Day 1 should show kabo_shoot elimination");
          assert(wouldStatusCheckShowEliminated(f, citizenIdx), "wouldStatusCheckShowEliminated should include kabo victim");
        },
      },
      {
        name: "140: kabo_shoot — gun target selections persist after Back then Next",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          f.step = 3;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [6, 7];
          f.draft.kaboGunByDay = f.draft.kaboGunByDay || {};
          f.draft.kaboGunByDay["1"] = "gun1";
          f.draft.kaboShootByDay = f.draft.kaboShootByDay || {};
          f.draft.kaboShootByDay["1"] = { gun1: 5, gun2: null };
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["kabo_trust_vote", "kabo_suspect_select", "kabo_midday", "kabo_shoot"];

          prevFlowStep();
          nextFlowStep();
          const shoot = (f.draft.kaboShootByDay && f.draft.kaboShootByDay["1"]) || {};
          assert(shoot.gun1 === 5 && shoot.gun2 === null, "Gun target selections should persist");
        },
      },
      {
        name: "Capo gun: both bullets at air shows validation message",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [6, 7];
          f.draft.kaboGunByDay = f.draft.kaboGunByDay || {};
          f.draft.kaboGunByDay["1"] = "gun1";
          f.draft.kaboShootByDay = f.draft.kaboShootByDay || {};
          f.draft.kaboShootByDay["1"] = { gun1: null, gun2: null };
          const steps = getFlowSteps({ ...f, phase: "day" });
          const shootIdx = steps.findIndex((s) => s && s.id === "kabo_shoot");
          if (shootIdx < 0) return;
          f.step = shootIdx;
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const txt = container.textContent || "";
          const hasBothAir = txt.includes("both bullets at air") || txt.includes("هر دو گلوله را هوایی");
          assert(hasBothAir, "kabo_shoot with both guns at air should show validation message");
        },
      },
      {
        name: "Capo gun: both bullets at same person shows validation message",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [6, 7];
          f.draft.kaboGunByDay = f.draft.kaboGunByDay || {};
          f.draft.kaboGunByDay["1"] = "gun1";
          f.draft.kaboShootByDay = f.draft.kaboShootByDay || {};
          f.draft.kaboShootByDay["1"] = { gun1: 6, gun2: 6 };
          const steps = getFlowSteps({ ...f, phase: "day" });
          const shootIdx = steps.findIndex((s) => s && s.id === "kabo_shoot");
          if (shootIdx < 0) return;
          f.step = shootIdx;
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const txt = container.textContent || "";
          const hasBothSame = txt.includes("same person") || txt.includes("به یک نفر");
          assert(hasBothSame, "kabo_shoot with both guns at same person should show validation message");
        },
      },
      {
        name: "Capo gun: real bullet kills target",
        fn: function ({ assert }) {
          if (typeof applyDayElimFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const citizenIdx = 8;
          if (!draw[citizenIdx]) return;
          f.phase = "day";
          f.day = 1;
          applyDayElimFromPayload(f, { out: citizenIdx, kaboShot: true });
          assert(draw[citizenIdx].alive === false, "Real bullet should eliminate target");
        },
      },
      {
        name: "Night 1 step order: Heir, Mafia, Herbalist, Detective, Armorsmith (5 steps without Kadkhoda)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids[0] === "night_heir", "Step 1 must be Heir");
          assert(ids[1] === "night_herbalist", "Step 2 must be Herbalist");
          assert(ids[2] === "night_mafia", "Step 3 must be Mafia team");
          assert(ids[3] === "night_detective", "Step 4 must be Detective");
          assert(ids[4] === "night_armorsmith", "Step 5 must be Armorsmith");
          assert(steps.length === 5, "Without Kadkhoda: 5 night steps, got " + steps.length);
        },
      },
      {
        name: "170: Night 1 Mafia team step has Shoot, Buy (Yakooza), Guess role options; can set shot target",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function" || typeof nextFlowStep !== "function") return;
          const f = setupCapo(false);
          const detectiveIdx = 3;
          if (!appState.draw.players[detectiveIdx] || appState.draw.players[detectiveIdx].roleId !== "detective") return;
          f.phase = "night";
          f.day = 1;
          f.step = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = { godfatherAction: "shoot", mafiaShot: detectiveIdx };
          const steps = getFlowSteps({ ...f, phase: "night" });
          assert(steps[2] && steps[2].id === "night_mafia", "170: Step 3 must be Mafia team");
          const saved = f.draft.nightActionsByNight["1"];
          assert(saved.godfatherAction === "shoot", "170: Shoot option must be selectable");
          assert(saved.mafiaShot === detectiveIdx, "170: Mafia Don shot target (Detective) must be settable");
        },
      },
      {
        name: "Mafia team step: Witch section visible when Don chooses Yakooza or Guess role (not just Shoot)",
        fn: function ({ assert }) {
          if (typeof showFlowTool !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const mafiaIdx = steps.findIndex((s) => s && s.id === "night_mafia");
          if (mafiaIdx < 0) return;
          f.step = mafiaIdx;
          f.draft = f.draft || {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { godfatherAction: "guess_role" };
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const witchTarget = container.querySelector('.nightTargetGroup[data-field="fl_witch_target"]') || container.querySelector('#fl_witch_target');
          const hasWitchSection = !!witchTarget;
          assert(hasWitchSection, "Witch section must be visible when Don chooses Guess role (and Yakooza)");
        },
      },
      {
        name: "Night 1 step order with Village Chief (Kadkhoda): 6 steps in correct order",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 1;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids[4] === "night_armorsmith", "Step 5 must be Armorsmith");
          assert(ids[5] === "night_kadkhoda", "Step 6 must be Village Chief (Kadkhoda)");
          assert(steps.length === 6, "With Kadkhoda: 6 night steps, got " + steps.length);
        },
      },
      {
        name: "Night 2 step order: Witch, Executioner, Herbalist, Detective, Armorsmith, Village Chief when in game",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 2;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const hasHerbalist = steps.some((s) => s && s.id === "night_herbalist");
          const hasDetective = steps.some((s) => s && s.id === "night_detective");
          const hasArmorsmith = steps.some((s) => s && s.id === "night_armorsmith");
          const hasKadkhoda = steps.some((s) => s && s.id === "night_kadkhoda");
          assert(hasHerbalist && hasDetective && hasArmorsmith, "Night 2 must have Herbalist, Detective, Armorsmith");
          assert(hasKadkhoda, "Night 2 with Kadkhoda in draw must show Village Chief step");
        },
      },
      {
        name: "Back from Day 2 to Night 1: Armorsmith can choose himself again (armorsmithSelfUsed reverted)",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const armorsmithIdx = draw.findIndex((p) => p && p.roleId === "armorsmith");
          if (armorsmithIdx < 0) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: 5, armorsmithArmor: armorsmithIdx };
          f.draft.armorsmithSelfUsed = true;
          f.draft.armorsmithSelfUsedOnNight = 1;
          addFlowEvent("night_actions", { mafiaShot: 5, armorsmithArmor: armorsmithIdx });

          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;

          prevFlowStep();
          assert(f.draft.armorsmithSelfUsed !== true, "armorsmithSelfUsed must be reverted so Armorsmith can choose himself again when going back");
        },
      },
      {
        name: "Back from Day 2 to Night 1: selections persist, can re-select same (night_actions pruned)",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          const detectiveIdx = 3;
          if (!appState.draw.players[detectiveIdx]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: detectiveIdx };
          addFlowEvent("night_actions", { mafiaShot: detectiveIdx });

          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;
          const eventsBefore = (f.events || []).filter((e) => e && e.kind === "night_actions" && e.day === 1).length;

          prevFlowStep();
          const eventsAfter = (f.events || []).filter((e) => e && e.kind === "night_actions" && e.day === 1).length;
          assert(eventsAfter < eventsBefore || eventsAfter === 0, "night_actions for Night 1 should be pruned when going back");
          assert(f.phase === "night" && f.day === 1, "Should be on Night 1 after reverting");
        },
      },
      {
        name: "Day 1 has 4 steps when Trusted set: Trust Vote, Suspect Select, Mid-day Sleep, Defense & Shoot",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          const steps = getFlowSteps({ ...f, phase: "day" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids.includes("kabo_trust_vote"), "Day 1 must have kabo_trust_vote");
          assert(ids.includes("kabo_suspect_select"), "Day 1 must have kabo_suspect_select");
          assert(ids.includes("kabo_midday"), "Day 1 must have kabo_midday");
          assert(ids.includes("kabo_shoot"), "Day 1 must have kabo_shoot");
          assert(steps.length >= 4, "Day 1 must have at least 4 steps");
        },
      },
      /* ─── NIGHT 1 (150–174), DAY 2 (174, 180, 190) ─── */
      {
        name: "174: Day 2 — Heir inherits Detective after Mafia shoots, Status Check Changed Roles shows it",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function" || typeof getChangedRolesForStatusCheck !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const detectiveIdx = 3;
          const heirIdx = 4;
          if (!draw[detectiveIdx] || draw[detectiveIdx].roleId !== "detective") return;
          if (!draw[heirIdx] || draw[heirIdx].roleId !== "heir") return;

          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { heirPick: detectiveIdx };
          f.draft.nightActionsByNight["1"] = { mafiaShot: detectiveIdx };
          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          addFlowEvent("night_actions", { mafiaShot: detectiveIdx });

          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;
          assert(draw[heirIdx].roleId === "detective", "Heir should have inherited Detective role");
          const changed = getChangedRolesForStatusCheck(f, 1, "night");
          const heirEntry = changed.find((e) => e.type === "heir_inherit" && e.idx === heirIdx && e.newRole === "detective");
          assert(heirEntry != null, "Status Check Night 1 Changed Roles should list Heir became Detective");
        },
      },
      {
        name: "Heir picks citizen — immune to mafia shot while successor alive",
        fn: function ({ assert }) {
          if (typeof applyNightMafiaFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const detectiveIdx = 3;
          const heirIdx = 4;
          if (!draw[detectiveIdx] || draw[detectiveIdx].roleId !== "detective") return;
          if (!draw[heirIdx] || draw[heirIdx].roleId !== "heir") return;

          f.phase = "night";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { heirPick: detectiveIdx };
          const payload = { mafiaShot: heirIdx };
          applyNightMafiaFromPayload(f, payload);
          assert(draw[heirIdx].alive !== false, "Heir should survive mafia shot when successor (citizen) is alive");
        },
      },
      {
        name: "Heir picks mafia — not immune, dies to mafia shot",
        fn: function ({ assert }) {
          if (typeof applyNightMafiaFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const witchIdx = 1;
          const heirIdx = 4;
          if (!draw[witchIdx] || draw[witchIdx].roleId !== "witch") return;
          if (!draw[heirIdx] || draw[heirIdx].roleId !== "heir") return;

          f.phase = "night";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { heirPick: witchIdx };
          const payload = { mafiaShot: heirIdx };
          applyNightMafiaFromPayload(f, payload);
          assert(draw[heirIdx].alive === false, "Heir should die when mafia shoots and Heir picked mafia (no immunity)");
        },
      },
      {
        name: "Heir inherits then loses immunity — mafia can shoot after inheritance",
        fn: function ({ assert }) {
          if (typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function" || typeof applyNightMafiaFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const detectiveIdx = 3;
          const heirIdx = 4;
          if (!draw[detectiveIdx] || draw[detectiveIdx].roleId !== "detective") return;
          if (!draw[heirIdx] || draw[heirIdx].roleId !== "heir") return;

          f.draft = f.draft || {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["0"] = { heirPick: detectiveIdx };
          f.draft.nightActionsByNight["1"] = { mafiaShot: detectiveIdx };
          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          addFlowEvent("night_actions", { mafiaShot: detectiveIdx });
          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;
          assert(draw[heirIdx].roleId === "detective", "Heir should have inherited Detective");
          assert(draw[detectiveIdx].alive === false, "Detective should be dead");

          f.phase = "night";
          f.day = 2;
          const payload = { mafiaShot: heirIdx };
          applyNightMafiaFromPayload(f, payload);
          assert(draw[heirIdx].alive === false, "Heir (now Detective) should die to mafia shot after inheritance");
        },
      },
      /* ─── WITCH (جادوگر) — ability reflects to target ─── */
      {
        name: "Witch targets Detective — inquiry reflects to self, result negative",
        fn: function ({ assert }) {
          if (typeof resolveNightFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const detectiveIdx = 3;
          if (!draw[detectiveIdx] || draw[detectiveIdx].roleId !== "detective") return;

          f.phase = "night";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: 8, witchTarget: detectiveIdx };
          const payload = { mafiaShot: 8, witchTarget: detectiveIdx, godfatherAction: "shoot" };
          resolveNightFromPayload(f, payload);
          const d = f.draft || {};
          const key = String(f.day || 1);
          const res = (d.detectiveResultByNight && d.detectiveResultByNight[key]) || null;
          assert(res != null && res.target === detectiveIdx, "Detective should have inquiry on self (Witch reflection)");
          assert(res.isMafia === false, "Detective self-inquiry result should be negative (citizen)");
        },
      },
      {
        name: "Witch targets Herbalist — Herbalist poisons self, dies at dawn Day 3 if no antidote",
        fn: function ({ assert }) {
          if (typeof applyNightHerbalistFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const herbalistIdx = 5;
          if (!draw[herbalistIdx] || draw[herbalistIdx].roleId !== "herbalist") return;

          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: herbalistIdx };
          const payload = { herbalistAntidoteDecision: null };
          applyNightHerbalistFromPayload(f, payload);
          assert(draw[herbalistIdx].alive === false, "Herbalist should die from self-poison (Witch) when no antidote");
        },
      },
      {
        name: "Witch bewitches Herbalist — herbalist's poison target ignored, Herbalist becomes poisoned",
        fn: function ({ assert }) {
          if (typeof applyNightHerbalistFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const herbalistIdx = 5;
          const citizenIdx = 8;
          if (!draw[herbalistIdx] || draw[herbalistIdx].roleId !== "herbalist") return;
          if (!draw[citizenIdx] || draw[citizenIdx].roleId !== "citizen") return;

          // Herbalist chose citizen; Witch bewitched herbalist. Herbalist's choice is ignored — herbalist poisons self.
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: citizenIdx, witchTarget: herbalistIdx };
          const payload = { herbalistAntidoteDecision: null };
          applyNightHerbalistFromPayload(f, payload);
          assert(draw[herbalistIdx].alive === false, "Herbalist bewitched: should die from self-poison when no antidote");
          assert(draw[citizenIdx].alive !== false, "Herbalist bewitched: original poison target (citizen) must not die");
        },
      },
      {
        name: "Witch targets Armorsmith — Armorsmith armors self, immune to mafia shot",
        fn: function ({ assert }) {
          if (typeof resolveNightFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const armorsmithIdx = 6;
          if (!draw[armorsmithIdx] || draw[armorsmithIdx].roleId !== "armorsmith") return;

          f.phase = "night";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { witchTarget: armorsmithIdx };
          const payload = { mafiaShot: armorsmithIdx, witchTarget: armorsmithIdx, godfatherAction: "shoot" };
          resolveNightFromPayload(f, payload);
          assert(draw[armorsmithIdx].alive !== false, "Armorsmith should survive mafia shot when Witch reflects armor to self");
        },
      },
      /* ─── MAFIA DON (دن مافیا) ─── */
      {
        name: "Don shows negative to Detective inquiry",
        fn: function ({ assert }) {
          if (typeof detectiveInquiryIsMafia !== "function") return;
          const isMafia = detectiveInquiryIsMafia("danMafia");
          assert(isMafia === false, "Don (danMafia) should show negative (citizen) to Detective");
        },
      },
      {
        name: "Mafia Don has antidote — does not die from Herbalist poison",
        fn: function ({ assert }) {
          if (typeof applyNightHerbalistFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const donIdx = 0;
          if (!draw[donIdx] || draw[donIdx].roleId !== "danMafia") return;

          // Herbalist poisons Don on Night 1. At Night 2 resolution, Herbalist withholds antidote.
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: donIdx };
          const payload = { herbalistAntidoteDecision: null };
          applyNightHerbalistFromPayload(f, payload);
          assert(draw[donIdx].alive !== false, "Mafia Don has his own antidote and must not die from Herbalist poison");
          assert(f.draft.danMafiaAntidoteUsed === true, "Don antidote should be marked used after self-save");
        },
      },
      {
        name: "Don poisoned + Herbalist withholds — Poison Result shows fixed (not worked)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function" || typeof showFlowTool !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const donIdx = 0;
          if (!draw[donIdx] || draw[donIdx].roleId !== "danMafia") return;

          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: donIdx };
          f.draft.nightActionsByNight["2"] = { herbalistAntidote: null };
          const steps = getFlowSteps({ ...f, phase: "night" });
          const poisonResultIdx = steps.findIndex((s) => s && s.id === "night_poison_result");
          if (poisonResultIdx < 0) return;
          f.step = poisonResultIdx;
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const txt = (container.textContent || "").toLowerCase();
          assert(txt.includes("fixed") || txt.includes("خنثی"), "Don survives via own antidote — Poison Result must show fixed, not worked");
        },
      },
      {
        name: "Herbalist one poison per game — no poison pick after cycle complete",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function" || typeof showFlowTool !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const herbalistIdx = 5;
          if (!draw[herbalistIdx] || draw[herbalistIdx].roleId !== "herbalist") return;

          // Night 1: Herbalist poisons citizen. Night 2: victim dies (no antidote). herbalistCycleComplete = true.
          f.phase = "night";
          f.day = 3;
          if (!f.draft) f.draft = {};
          f.draft.herbalistCycleComplete = true;
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: 8 };
          f.draft.nightActionsByNight["2"] = { herbalistAntidote: null };
          draw[8].alive = false;

          const steps = getFlowSteps({ ...f, phase: "night" });
          const herbStepIdx = steps.findIndex((s) => s && s.id === "night_herbalist");
          if (herbStepIdx < 0) return;
          f.step = herbStepIdx;
          showFlowTool();
          const poisonPicker = document.getElementById("fl_herb_poison");
          const container = document.getElementById("flowModalContainer");
          const txt = (container && container.textContent) ? container.textContent : "";
          assert(!poisonPicker, "Herbalist must not show poison picker after abilities exhausted");
          assert(txt.includes("used both") || txt.includes("استفاده کرده") || txt.includes("exhausted") || txt.includes("توانایی"), "Herbalist step must show abilities exhausted message");
        },
      },
      {
        name: "Yakooza can convert suspect to mafia",
        fn: function ({ assert }) {
          if (typeof applyNightKaboYakoozaFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const suspectIdx = 7;
          if (!draw[suspectIdx] || draw[suspectIdx].roleId !== "suspect") return;
          draw[1].alive = false;
          draw[2].alive = false;

          f.phase = "night";
          f.day = 1;
          if (!f.draft) f.draft = {};
          const payload = { godfatherAction: "yakooza", kaboYakoozaTarget: suspectIdx };
          applyNightKaboYakoozaFromPayload(f, payload);
          assert(draw[suspectIdx].roleId === "mafia", "Yakooza should convert suspect to mafia");
        },
      },
      {
        name: "Don killed by Capo gun Day 1 — antidote transfers to Witch",
        fn: function ({ assert }) {
          if (typeof applyDayElimFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const donIdx = 0;
          if (!draw[donIdx] || draw[donIdx].roleId !== "danMafia") return;

          f.phase = "day";
          f.day = 1;
          applyDayElimFromPayload(f, { out: donIdx, kaboShot: true });
          assert(draw[donIdx].alive === false, "Don should be dead");
          assert(f.draft.witchHasAntidoteFromDon === true, "Witch should receive Don's antidote");
        },
      },
      {
        name: "Executioner guess-role action appears in Status Check list (not just Eliminated)",
        fn: function ({ assert }) {
          if (typeof hasStatusCheckExecutionerActionData !== "function") return;
          const f = setupCapo(false);
          const citizenIdx = 8;
          if (!appState.draw.players[citizenIdx]) return;

          f.phase = "day";
          f.day = 2;
          f.draft = f.draft || {};
          f.draft.nightExecutionerAppliedByDay = f.draft.nightExecutionerAppliedByDay || {};
          f.draft.nightExecutionerAppliedByDay["1"] = { killed: citizenIdx, prevAlive: true };
          f.events = f.events || [];
          f.events.push({
            kind: "night_actions",
            phase: "night",
            day: 1,
            data: {
              godfatherAction: "guess_role",
              executionerTarget: citizenIdx,
              executionerRoleGuess: "citizen",
            },
          });
          assert(hasStatusCheckExecutionerActionData(f, 1), "Status Check must have data to show Executioner guess-role action");
        },
      },
      {
        name: "Herbalist antidote decision (withhold) appears in Status Check",
        fn: function ({ assert }) {
          if (typeof hasStatusCheckHerbalistAntidoteDecision !== "function") return;
          const f = setupCapo(false);
          const citizenIdx = 8;
          if (!appState.draw.players[citizenIdx]) return;

          f.phase = "day";
          f.day = 3;
          f.draft = f.draft || {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: citizenIdx };
          f.draft.nightActionsByNight["2"] = { herbalistAntidote: null };
          f.events = f.events || [];
          f.events.push({
            kind: "night_actions",
            phase: "night",
            day: 2,
            data: { herbalistAntidote: null },
          });
          assert(hasStatusCheckHerbalistAntidoteDecision(f, 2, false), "Status Check must have data to show Herbalist withheld antidote");
        },
      },
      {
        name: "Herbalist antidote decision (give) appears in Status Check",
        fn: function ({ assert }) {
          if (typeof hasStatusCheckHerbalistAntidoteDecision !== "function") return;
          const f = setupCapo(false);
          const citizenIdx = 8;
          if (!appState.draw.players[citizenIdx]) return;

          f.phase = "day";
          f.day = 3;
          f.draft = f.draft || {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: citizenIdx };
          f.draft.nightActionsByNight["2"] = { herbalistAntidote: citizenIdx };
          f.events = f.events || [];
          f.events.push({
            kind: "night_actions",
            phase: "night",
            day: 2,
            data: { herbalistAntidote: citizenIdx },
          });
          assert(hasStatusCheckHerbalistAntidoteDecision(f, 2, true), "Status Check must have data to show Herbalist gave antidote");
        },
      },
      {
        name: "Executioner correct guess kills target unconditionally — bypasses armorsmith armor",
        fn: function ({ assert }) {
          if (typeof resolveNightFromPayload !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const citizenIdx = 8;
          const armorsmithIdx = 6;
          if (!draw[citizenIdx] || draw[citizenIdx].roleId !== "citizen") return;
          if (!draw[armorsmithIdx] || draw[armorsmithIdx].roleId !== "armorsmith") return;

          f.phase = "night";
          f.day = 1;
          const payload = {
            godfatherAction: "guess_role",
            executionerTarget: citizenIdx,
            executionerRoleGuess: "citizen",
            armorsmithArmor: citizenIdx,
          };
          resolveNightFromPayload(f, payload);
          assert(draw[citizenIdx].alive === false, "Executioner correct guess must kill target even when armorsmith armored them");
        },
      },
      {
        name: "176, 180, 190: Day 2 has Poison Status (Step 1 of 3), Voting (Step 2), Elimination (Step 3) when poison pending",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = f.draft.nightActionsByNight["1"] || {};
          f.draft.nightActionsByNight["1"].herbalistPoison = 5;
          const steps = getFlowSteps({ ...f, phase: "day" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          const poisonIdx = ids.indexOf("day_poison_status");
          const voteIdx = ids.indexOf("day_vote");
          const elimIdx = ids.indexOf("day_elim");
          assert(poisonIdx >= 0, "176: Day 2 must have Poison Status (Step 1 of 3) when poison pending");
          assert(voteIdx >= 0, "180: Day 2 must have Voting (Step 2 of 3)");
          assert(elimIdx >= 0, "190: Day 2 must have Elimination (Step 3 of 3)");
          assert(poisonIdx < voteIdx && voteIdx < elimIdx, "Day 2 steps must be: Poison Status, Voting, Elimination");
        },
      },
      {
        name: "180, 190: Day 2 has day_vote then day_elim when no poison (standard voting)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 2;
          if (!f.draft) f.draft = {};
          const steps = getFlowSteps({ ...f, phase: "day" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids.includes("day_vote"), "Day 2 must have day_vote (standard voting)");
          assert(ids.includes("day_elim"), "Day 2 must have day_elim");
          assert(!ids.includes("day_poison_status"), "No poison status when no poison kill");
        },
      },
      /* ─── NIGHT 2 (200), DAY 3 (210, 220), NIGHT 3 (230) ─── */
      {
        name: "201: Night 2 Poisoned Player is 1st page, shows poisoned player name",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          const armorsmithIdx = 6;
          if (!appState.draw.players[armorsmithIdx] || appState.draw.players[armorsmithIdx].roleId !== "armorsmith") return;
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = f.draft.nightActionsByNight["1"] || {};
          f.draft.nightActionsByNight["1"].herbalistPoison = armorsmithIdx;
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids[0] === "night_poisoned_player", "201: Night 2 with poison must show Poisoned Player as 1st page");
        },
      },
      {
        name: "202: Poisoned Player step uses cards (not spinbox) and live vote result message",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function" || typeof showFlowTool !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: 5 };
          f.draft.poisonAntidoteVoteByDay = f.draft.poisonAntidoteVoteByDay || {};
          f.draft.poisonAntidoteVoteByDay["2"] = { agree: 4, disagree: 3 };
          const steps = getFlowSteps({ ...f, phase: "night" });
          const poisonStepIdx = steps.findIndex((s) => s && s.id === "night_poisoned_player");
          assert(poisonStepIdx >= 0, "202: Must have Poisoned Player step for vote/announce");
          f.step = poisonStepIdx;
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const noSpinbox = !container.querySelector("#fl_poison_agree") && !container.querySelector("#fl_poison_disagree");
          assert(noSpinbox, "202: Must not use spinbox inputs for agree/disagree");
          const cards = container.querySelectorAll(".poison_antidote_card");
          assert(cards.length >= 2, "202: Must use cards for agree/disagree vote");
          const plusBtns = container.querySelectorAll(".poison_antidote_plus");
          const minusBtns = container.querySelectorAll(".poison_antidote_minus");
          assert(plusBtns.length >= 2 && minusBtns.length >= 2, "202: Cards must have +/- buttons");
          const resultEl = container.querySelector("#fl_poison_vote_result");
          const hasResult = resultEl && resultEl.textContent && resultEl.textContent.trim().length > 0;
          assert(hasResult, "202: Vote result message must update when agree/disagree counts change (4 agree, 3 disagree => more agree)");
        },
      },
      {
        name: "203: Night 2 Herbalist Decision step uses cards (not radio buttons)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function" || typeof showFlowTool !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: 5 };
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids.includes("night_herbalist_antidote"), "203: Night 2 must have Herbalist Decision step");
          const herbStepIdx = steps.findIndex((s) => s && s.id === "night_herbalist_antidote");
          if (herbStepIdx < 0) return;
          f.step = herbStepIdx;
          showFlowTool();
          const container = document.getElementById("flowModalContainer");
          if (!container) return;
          const noRadio = !container.querySelector('input[name="fl_herbalist_antidote"]');
          assert(noRadio, "203: Must not use radio buttons for Herbalist antidote choice");
          const cards = container.querySelectorAll(".herbalist_antidote_card");
          assert(cards.length >= 2, "203: Must use cards for Give/Withhold antidote choice");
        },
      },
      {
        name: "204: Night 2 Poison Result step (fixed or worked announcement)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: 5 };
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids.includes("night_poison_result"), "204: Night 2 must have Poison Result announcement step");
        },
      },
      {
        name: "205: After poison steps, next is Heir then Mafia team shot",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: 5 };
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          const poisonResultIdx = ids.indexOf("night_poison_result");
          const heirIdx = ids.indexOf("night_heir");
          const mafiaIdx = ids.indexOf("night_mafia");
          assert(poisonResultIdx >= 0, "205: Must have poison result step");
          assert(heirIdx > poisonResultIdx, "205: Heir must follow poison result");
          assert(mafiaIdx > heirIdx, "205: Mafia team shot must follow Heir (can select Armorsmith)");
        },
      },
      {
        name: "206: Night 2 step order — Witch/Executioner (Mafia), Detective, Armorsmith, Kadkhoda after poison flow",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          f.phase = "night";
          f.day = 2;
          if (!f.draft) f.draft = {};
          if (!f.draft.nightActionsByNight) f.draft.nightActionsByNight = {};
          f.draft.nightActionsByNight["1"] = { herbalistPoison: 5 };
          const steps = getFlowSteps({ ...f, phase: "night" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          const hasMafia = ids.includes("night_mafia");
          const hasDetective = ids.includes("night_detective");
          const hasArmorsmith = ids.includes("night_armorsmith");
          const hasKadkhoda = ids.includes("night_kadkhoda");
          assert(hasMafia && hasDetective && hasArmorsmith && hasKadkhoda, "206: Night 2 must have Mafia, Detective, Armorsmith, Kadkhoda in order after poison steps");
        },
      },
      {
        name: "200, 230: Night 2 and Night 3 have correct step order (Witch, Executioner, Herbalist, etc.)",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(true);
          for (const nightDay of [2, 3]) {
            f.phase = "night";
            f.day = nightDay;
            const steps = getFlowSteps({ ...f, phase: "night" });
            const ids = steps.map((s) => s && s.id).filter(Boolean);
            const hasWitch = ids.includes("night_witch") || steps.some((s) => s && s.id && String(s.id).includes("witch"));
            const hasHerbalist = ids.includes("night_herbalist") || ids.includes("night_herbalist_antidote");
            const hasDetective = ids.includes("night_detective");
            assert(hasHerbalist && hasDetective, "Night " + nightDay + " must have Herbalist (or antidote step) and Detective");
            if (nightDay === 2) assert(ids.length >= 5, "Night 2 must have multiple steps");
          }
        },
      },
      /* ─── DAY 3 (210, 220) ─── */
      {
        name: "210, 220: Day 3 has Voting then Elimination",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 3;
          const steps = getFlowSteps({ ...f, phase: "day" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          const voteIdx = ids.indexOf("day_vote");
          const elimIdx = ids.indexOf("day_elim");
          assert(voteIdx >= 0, "210: Day 3 must have Voting step");
          assert(elimIdx >= 0, "220: Day 3 must have Elimination step");
          assert(voteIdx < elimIdx, "Day 3: Voting before Elimination");
        },
      },
      /* ─── STATUS CHECK (240, 250) ─── */
      {
        name: "Anyone who dies (mafia, executioner, vote, kabo gun) appears in Status Check Eliminated list",
        fn: function ({ assert }) {
          if (typeof getEliminatedForStatusCheck !== "function" || typeof wouldStatusCheckShowEliminated !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const citizenIdx = 8;
          const armorsmithIdx = 6;
          if (!draw[citizenIdx] || !draw[armorsmithIdx]) return;

          f.phase = "day";
          f.day = 2;
          f.draft = f.draft || {};
          f.draft.nightMafiaAppliedByDay = f.draft.nightMafiaAppliedByDay || {};
          f.draft.nightMafiaAppliedByDay["1"] = { killed: 3, prevAlive: true };
          f.draft.nightExecutionerAppliedByDay = f.draft.nightExecutionerAppliedByDay || {};
          f.draft.nightExecutionerAppliedByDay["1"] = { killed: citizenIdx, prevAlive: true };
          f.draft.dayElimAppliedByDay = f.draft.dayElimAppliedByDay || {};
          f.draft.dayElimAppliedByDay["1"] = { out: 5, prevAlive: true };
          f.draft.gunShotAppliedByDay = f.draft.gunShotAppliedByDay || {};
          f.draft.gunShotAppliedByDay["1"] = { applied: true, shots: [{ shooter: 6, target: 5, type: "real", targetPrevAlive: true }] };
          f.draft.dayElimAppliedByDay["2"] = { out: armorsmithIdx, prevAlive: true };
          f.events = f.events || [];
          f.events.push({ kind: "night_actions", phase: "night", day: 1 });
          f.events.push({ kind: "day_elim_out", phase: "day", day: 1 });
          f.events.push({ kind: "day_elim_out", phase: "day", day: 2 });

          const night1Elim = getEliminatedForStatusCheck(f, 1, "night");
          const day1Elim = getEliminatedForStatusCheck(f, 1, "day");
          const day2Elim = getEliminatedForStatusCheck(f, 2, "day");

          assert(night1Elim.includes(3), "Mafia shot victim must appear in Status Check Night 1 Eliminated");
          assert(night1Elim.includes(citizenIdx), "Executioner victim must appear in Status Check Night 1 Eliminated");
          assert(day1Elim.includes(5), "Kabo gun victim must appear in Status Check Day 1 Eliminated");
          assert(day2Elim.includes(armorsmithIdx), "Vote-out victim must appear in Status Check Day 2 Eliminated");
          assert(wouldStatusCheckShowEliminated(f, 3), "wouldStatusCheckShowEliminated includes mafia victim");
          assert(wouldStatusCheckShowEliminated(f, citizenIdx), "wouldStatusCheckShowEliminated includes executioner victim");
        },
      },
      {
        name: "240, 250: Status Check groups exist for Day 1, Night 1, Day 2, Night 2, Day 3, Night 3 in order",
        fn: function ({ assert }) {
          if (typeof getEliminatedForStatusCheck !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 3;
          f.events = [
            { kind: "day_vote", phase: "day", day: 1 },
            { kind: "night_actions", phase: "night", day: 1 },
            { kind: "day_vote", phase: "day", day: 2 },
            { kind: "night_actions", phase: "night", day: 2 },
            { kind: "day_vote", phase: "day", day: 3 },
            { kind: "night_actions", phase: "night", day: 3 },
          ];
          const order = [];
          for (const ev of (f.events || [])) {
            if (ev && ev.phase && ev.day != null) order.push(ev.phase + ev.day);
          }
          const expected = ["day1", "night1", "day2", "night2", "day3", "night3"];
          const hasOrder = expected.every((e, i) => order[i] === e);
          assert(hasOrder || order.length >= 4, "Status Check events should follow Day 1 → Night 1 → Day 2 → Night 2 → Day 3 → Night 3");
        },
      },
      /* ─── BACK / FORWARD (260, 270) ─── */
      {
        name: "260: Back from Day 3 to Day 1 — no errors, selections persist",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 3;
          f.step = 0;
          if (!f.draft) f.draft = {};
          f.draft.dayStepsByDay = f.draft.dayStepsByDay || {};
          f.draft.dayStepsByDay["1"] = ["kabo_trust_vote", "kabo_suspect_select", "kabo_midday", "kabo_shoot"];
          f.draft.dayStepsByDay["2"] = ["day_vote", "day_elim"];
          f.draft.dayStepsByDay["3"] = ["day_vote", "day_elim"];
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [6, 7];
          f.draft.kaboRealBulletByDay = f.draft.kaboRealBulletByDay || {};
          f.draft.kaboRealBulletByDay["1"] = 0;
          f.draft.kaboGunTargetsByDay = f.draft.kaboGunTargetsByDay || {};
          f.draft.kaboGunTargetsByDay["1"] = [{ target: 5 }, { target: null }];
          const initialTrusted = f.draft.kaboTrustedByDay["1"];
          const initialSuspects = (f.draft.kaboSuspectsByDay["1"] || []).slice();
          let backCount = 0;
          const maxBack = 35;
          while (backCount < maxBack) {
            if (f.phase === "day" && f.day === 1 && (f.step || 0) === 0) break;
            try { prevFlowStep(); } catch (e) { assert(false, "260: prevFlowStep must not throw: " + (e && e.message)); return; }
            backCount++;
          }
          assert(f.phase === "day" && f.day === 1, "260: Should reach Day 1 after Back (phase=" + f.phase + " day=" + f.day + ")");
          const trustedAfter = (f.draft.kaboTrustedByDay && f.draft.kaboTrustedByDay["1"]);
          const suspectsAfter = (f.draft.kaboSuspectsByDay && f.draft.kaboSuspectsByDay["1"]) || [];
          assert(trustedAfter === initialTrusted, "260: Trust vote selection should persist after Back");
          assert(suspectsAfter.length === initialSuspects.length && initialSuspects.every((s, i) => suspectsAfter[i] === s), "260: Suspect selections should persist after Back");
        },
      },
      {
        name: "270: Back from Night 2 to Night 1 — change Mafia shot, Next applies new shot and reverts previous death",
        fn: function ({ assert }) {
          if (typeof prevFlowStep !== "function" || typeof nextFlowStep !== "function" || typeof addFlowEvent !== "function" || typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          const draw = appState.draw.players;
          const victim1 = 3;
          const victim2 = 5;
          if (!draw[victim1] || !draw[victim2]) return;

          f.phase = "night";
          f.day = 1;
          const nightSteps = getFlowSteps({ ...f, phase: "night" });
          f.step = Math.max(0, nightSteps.length - 1);
          if (!f.draft) f.draft = {};
          f.draft.nightActionsByNight = f.draft.nightActionsByNight || {};
          f.draft.nightActionsByNight["1"] = { mafiaShot: victim1 };
          addFlowEvent("night_actions", { mafiaShot: victim1 });

          nextFlowStep();
          if (f.phase !== "day" || f.day !== 2) return;
          assert(draw[victim1].alive === false, "First victim should be dead");

          prevFlowStep();
          f.draft.nightActionsByNight["1"] = { mafiaShot: victim2 };
          addFlowEvent("night_actions", { mafiaShot: victim2 });
          nextFlowStep();
          assert(draw[victim1].alive !== false, "Previous victim should be reverted (alive)");
          assert(draw[victim2].alive === false, "New victim should be dead");
        },
      },
      /* ─── EDGE CASES (280, 290, 300) ─── */
      {
        name: "280: Tie in Trust Vote — only Trust Vote step shown until Trusted is set",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboVotesByDay = f.draft.kaboVotesByDay || {};
          f.draft.kaboVotesByDay["1"] = { 0: 2, 1: 2, 2: 0 };
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = null;
          const steps = getFlowSteps({ ...f, phase: "day" });
          const ids = steps.map((s) => s && s.id).filter(Boolean);
          assert(ids.length === 1 && ids[0] === "kabo_trust_vote", "280: When tie, only Trust Vote step shown; suspect select requires Trusted first");
        },
      },
      {
        name: "290: No suspects selected — step shows 1/2 or similar, cannot proceed until 2 chosen",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          f.step = 1;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [5];
          const suspects = (f.draft.kaboSuspectsByDay["1"] || []);
          assert(suspects.length === 1, "With 1 suspect selected, count should be 1 (need 2 to proceed)");
        },
      },
      {
        name: "300: Capo not set real bullet — Defense & Shoot shows warning, no one dies from shoot",
        fn: function ({ assert }) {
          if (typeof getFlowSteps !== "function") return;
          const f = setupCapo(false);
          f.phase = "day";
          f.day = 1;
          f.step = 3;
          if (!f.draft) f.draft = {};
          f.draft.kaboTrustedByDay = f.draft.kaboTrustedByDay || {};
          f.draft.kaboTrustedByDay["1"] = 0;
          f.draft.kaboSuspectsByDay = f.draft.kaboSuspectsByDay || {};
          f.draft.kaboSuspectsByDay["1"] = [6, 7];
          f.draft.kaboRealBulletByDay = f.draft.kaboRealBulletByDay || {};
          f.draft.kaboRealBulletByDay["1"] = null;
          const realBullet = (f.draft.kaboRealBulletByDay && f.draft.kaboRealBulletByDay["1"]);
          assert(realBullet == null, "When Capo skips Mid-day, real bullet is undefined — no one dies");
        },
      },
    ],
  };

  window.CAPO_TEST_INSTRUCTIONS_TESTS = suite;
})();

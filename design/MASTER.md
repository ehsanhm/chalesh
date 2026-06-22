# Mafia Game — Master Reference

This is the **single-document reference** for the entire app. It covers game mechanics, all scenarios, the Flow tool architecture, and implementation notes. Individual scenario detail files are in `design/<scenario_id>.md`.

---

## Table of Contents

1. [App Architecture](#app-architecture)
2. [Flow Tool — Timeline Navigator](#flow-tool--timeline-navigator)
3. [Phases and Sub-steps](#phases-and-sub-steps)
4. [Dynamic Step Rules](#dynamic-step-rules)
5. [All Scenarios](#all-scenarios)
6. [Role Quick Reference](#role-quick-reference)
7. [Vote Threshold Reference](#vote-threshold-reference)
8. [Implementation Map](#implementation-map)
9. [Known Gaps / TODO](#known-gaps--todo)

---

## App Architecture

| File | Purpose |
|------|---------|
| `index.html` | Main app (~3,358 lines): HTML + inline JS for setup UI, cast, tools, event wiring, init |
| `style.css` | All CSS (~1,323 lines) |
| `strings.js` | `const STR` i18n object (FA + EN) |
| `roles.js` | `const roles` + `const ROLE_I18N` |
| `scenarios.js` | Single source of truth for scenario configs (roles, wakeOrder, features, eliminationCards) |
| `i18n.js` | `t()`, `setLanguage()`, `applyStaticI18n()` |
| `flow-engine.js` | Game logic: `ensureFlow`, `nextFlowStep`, `prevFlowStep`, all `applyXxx`/`revertXxx` functions |
| `flow-ui.js` | `showFlowTool()`, step renderers, night UI, `snapshotNightActionsFromUI` |
| `effect-registry.js` | Central `registerEffect(stepId, { apply, revert })` for all reversible flow steps |
| `flow-configs.js` | `getFlowConfig(scenarioId)` loader |
| `flow-configs/*.js` | Per-scenario phase and step definitions |

**Key state:** `appState.god.flow` (the flow draft/events), `appState.draw` (players/roles), `appState.god.endCards` (elimination cards).

**Scenario detection:** Always use `getDrawScenarioForFlow()` — never `appState.draw.scenario`. The scenario is stored in `appState.draw.uiAtDraw.scenario`.

---

## Flow Tool — Timeline Navigator

The Flow tool (`showFlowTool()` in `flow-ui.js`) navigates through a linear sequence of **main phases**, each with one or more **sub-steps**:

```
Intro Day → Intro Night → Day 1 → Night 1 → Day 2 → Night 2 → … → Winner
```

Navigation uses `nextFlowStep()` / `prevFlowStep()` in `flow-engine.js`. The current position is stored as `f.phase` + `f.day` + `f.step` (step index within the current phase).

**Key principle:** The flow is a unidirectional timeline. Previous pages affect later pages, never the reverse. Going back from step N to step N-1 must never erase state owned by step N-1.

---

## Phases and Sub-steps

### Intro Day (`phase: "intro_day"`)

- One step: `intro_day_run` — display only. Players introduce themselves.
- Defined in `flow-configs/<scenario>.js` → `intro_day: ["intro_day_run"]`.

### Intro Night (`phase: "intro_night"`)

- Standard: `intro_night_run` — display only. Mafia wakes to meet team.
- Pedarkhande: `intro_night_nostradamus` → `nostradamus_choose_side` → `intro_night_mafia` → `intro_night_wake_order`.
- Defined in `flow-configs/<scenario>.js` → `intro_night: [...]`.

### Day (`phase: "day"`)

Each day includes **dawn resolution** display (Day 2+) and the scenario's day steps. Day steps are scenario-dependent (see [All Scenarios](#all-scenarios)). The last day step always leads to **dusk resolution** display.

Dynamic steps (only shown when applicable):
- `day_kane_reveal?` — only when Citizen Kane correctly marked a mafia player (pedarkhande).
- `day_guns?` — only when guns exist or bomb is planted (zodiac).
- `day_gun_expiry?` — only when unfired real guns exist (zodiac).
- `day_end_card_pick` — only after `dayElimAppliedByDay[day].out` is set AND scenario has `endCards: true`.
- `day_end_card_{cardId}` — only when `byDay[day].cardId` is set (after card picked).
- Bazras interrogation steps — only when both interrogation targets survived the previous night.

### Night (`phase: "night"`)

One page per role wake-up. Step IDs come from `flow-configs/<scenario>.js` → `night: [...]`. Each step shows the relevant role's form controls. Steps are filtered dynamically:
- Roles not in the draw are skipped (`keepRoleInDraw` in `flow-ui.js`).
- Zodiac wakes only on even nights.
- Bomber wakes only if bomb not yet used.
- Nostradamus (pedarkhande) intro night only.

Resolution runs after the last night step (when `nextFlowStep` advances to Day).

### Winner (`phase: "winner"`)

- One step: `winner_run` — shows winning side. No Next button.

---

## Dynamic Step Rules

| Condition | Step added | Scenario |
|-----------|-----------|---------|
| Guns distributed / bomb planted | `day_guns` | zodiac |
| Unfired real guns exist | `day_gun_expiry` | zodiac |
| Citizen Kane marked mafia (prev day) | `day_kane_reveal` | pedarkhande |
| Player was eliminated today (`dayElimApplied`) + `endCards: true` | `day_end_card_pick` | pedarkhande, shab_mafia |
| Card picked on pick step | `day_end_card_{cardId}` | pedarkhande, shab_mafia |
| Inspector picked 2 players AND both survived | `bazras_interrogation` → `bazras_midday` → `bazras_forced_vote` | bazras |
| Kabo Day 1 AND trust-vote passed | `kabo_trust_vote` → `kabo_suspect_select` → `kabo_midday` → `kabo_shoot` | kabo |
| Kabo Day 2+ | `day_vote` → `day_elim` | kabo |
| Namayande Day 1 | `namayande_rep_election` | namayande |
| Namayande Day 2+ | `namayande_rep_action` → `namayande_cover` → `namayande_defense` → `namayande_vote` | namayande |
| Dawn resolution (Day 2+) | `day_dawn_resolution` prepended | all |
| Dusk resolution (always at day end) | `day_dusk_resolution` appended | all |

---

## All Scenarios

### Classic (`classic`)

**Roles:** Mafia Boss, Simple Mafia, Detective, Doctor.
**Day:** `day_vote` → `day_elim`. Vote threshold: more than half.
**Night:** Mafia team → Doctor → Detective.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [classic.md](classic.md)

---

### Inspector / Bazras (`bazras`)

**Roles:** Mafia Boss, NATO, Swindler, Detective, Doctor, Investigator, Researcher, Sniper, Invulnerable.
**Day:** `day_vote` → `day_elim`. When interrogation active: `bazras_interrogation` → `bazras_midday` → `bazras_forced_vote` → `day_vote` → `day_elim`.
**Night:** Researcher → Mafia team → Swindler → Doctor → Sniper → Detective → Inspector (Investigator).
**Special rules:** Sniper shooting Mafia Boss → no kill. Doctor self-save ×2. Swindler can repeat consecutive nights. Researcher link-kill for NATO/Swindler only.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [bazras.md](bazras.md)

---

### Representative / Namayande (`namayande`)

**Roles:** Don (mafia leader), Rebel, Hacker, NATO, Doctor, Guide, Minemaker, Bodyguard, Lawyer, Soldier, Simple Citizen.
**Day 1:** `namayande_rep_election`.
**Day 2+:** `namayande_rep_action` → `namayande_cover` → `namayande_defense` → `namayande_vote`.
**Night:** Hacker → Mafia team → Guide → Doctor → Bodyguard → Soldier → Minemaker → Lawyer.
**Special rules:** Rebel explosion triggers when any mafia eliminated (before next vote). Bodyguard protects from Rebel. Doctor self-save ×2. Guide reveals identity to mafia if they pick a mafia member.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [namayande.md](namayande.md)
**Gap:** Rebel explosion mechanic not yet implemented in engine. *(See Known Gaps.)*

---

### Negotiator / Mozaker (`mozaker`)

**Roles:** Mafia Boss, Negotiator, Simple Mafia, Detective, Doctor, Armored, Reporter, Sniper.
**Day:** `day_vote` → `day_elim`. Threshold: more than half.
**Night:** Mafia team → Doctor → Detective → Negotiator → Reporter.
**Special rules:** Negotiator once-per-game converts simple citizen or armored (with vest) to mafia, when 1–2 mafia already out. Wrong target → negotiation fails, mafia loses shot. Mafia Boss immune to Sniper. Reporter queries converted-player status after negotiation night.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [mozaker.md](mozaker.md)

---

### Commando / Takavar (`takavar`)

**Roles — Mafia:** Don (Mafia Boss), NATO, Hostage-Taker (گروگانگیر).
**Roles — City:** Doctor, Commando (تکاور), Detective, Gunner (تفنگدار), Guardian (نگهبان), Simple Citizen.
**Day:** `day_vote` → `day_elim`. Vote threshold: 4+ (10–8p), 3+ (7–6p), 2+ (5–4p).
**Night:** Guardian → Hostage-Taker (solo) → Mafia team → Detective → Commando → Doctor → Gunner.
**Special rules:** Hostage-Taker blocks one ability per night (solo wake, no consecutive targets). Guardian protects 2 players if 8+ alive, else 1 (nullifies Hostage-Taker). Commando counter-shoots if killed by Mafia. NATO once-per-game role guess (silent fail). Gunner distributes 1 real + unlimited blanks at night.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [takavar.md](takavar.md)

---

### Capo / Kabo (`kabo`)

**Roles:** Dan Mafia (Capo), Witch, Executioner, Detective, Heir, Herbalist, Armorsmith, Suspect, Village Chief, Simple Citizen.
**Day 1:** `kabo_trust_vote` → `kabo_suspect_select` → `kabo_midday` → `kabo_shoot`.
**Day 2+:** `day_vote` → `day_elim`.
**Night:** Heir → Herbalist → Mafia team → Detective → Armorsmith → Village Chief.
**Special rules:** Capo bullet queue ordered by Dan's nightly pick. Witch reflects ability. Herbalist poison countered by Dan's antidote. Heir inherits ability. kabo_shoot applies death immediately.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [kabo.md](kabo.md)

---

### Godfather / Pedarkhande (`pedarkhande`)

**Roles:** Godfather, Matador, Saul Goodman, Dr. Watson, Leon, Citizen Kane, Constantine, Nostradamus, Simple Citizen.
**Intro Night:** Nostradamus → choose side → Mafia team → Watson/Leon/Kane/Constantine.
**Day:** `day_kane_reveal?` → `day_vote` → `day_elim` → `day_end_card_pick` → `day_end_card_{cardId}`.
**Night:** Mafia team → Watson → Leon → Kane → Constantine.
**Elimination cards:** Beautiful Mind, Identity Reveal, Silence of the Lambs, Handcuffs, Face Change.
**Special rules:** Godfather sixth sense, Saul buy, Watson save, Leon vest, Kane mark, Constantine revive. Vote threshold: half-minus-one for defense, half for elimination.
**Win:** Mafia ≥ city, or all mafia out. Nostradamus wins with chosen side.
**Design doc:** [pedarkhande.md](pedarkhande.md)

---

### Zodiac (`zodiac`)

**Roles:** Al Capone, Zodiac (independent), Magician, Bomber, Detective, Doctor, Professional, Guard, Ocean, Gunslinger.
**Day:** `day_guns?` → `day_gun_expiry?` → `day_vote` → `day_elim`.
**Night:** Mafia team → Magician → Bomber → Professional → Doctor → Detective → Gunslinger → Ocean → Zodiac.
**Special rules:** Zodiac shoots even nights only. Bomb planted at night, diffused during day. Guard can sacrifice for bomb. Gunslinger gives guns; unused real guns burn.
**Win:** Zodiac: final 2 remain. City: all mafia + Zodiac out. Mafia: Zodiac out + mafia ≥ city.
**Design doc:** [zodiac.md](zodiac.md)

---

### Meeting / Epic (`meeting_epic`)

**Roles:** Mafia Boss, NATO, Natasha, Dr. Lecter (city-side), Detective, Doctor, Sniper, Armored, Judge, Commander, Priest.
**Day:** `day_vote` → `day_elim`. Threshold: more than half.
**Night:** Natasha → Mafia team (Boss/NATO) → Dr. Lecter → Doctor → Detective → Sniper.
**Special rules:** Natasha observes one player each night (learns role if they act). NATO once-per-game role guess. Dr. Lecter city-side (saves from mafia shot). Armored has one vest.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [meeting_epic.md](meeting_epic.md)

---

### Advanced / Pishrafte (`pishrafte`)

**Roles:** Mafia Boss, Godfather, Dr. Lecter (mafia), Joker Mafia, NATO, Natasha, Swindler, Detective, Doctor, Sniper, Professional, Armored, Invulnerable, Judge, Commander, Priest, Researcher, Investigator.
**Day:** `day_vote` → `day_elim`. Threshold: more than half.
**Night:** Researcher → Swindler → Natasha → Mafia team → Dr. Lecter → Joker Mafia → Professional → Doctor → Detective → Sniper.
**Special rules:** All major roles combined. Godfather shows as citizen. Dr. Lecter (mafia) saves mafia from city shots. JokerMafia flips Detective result (max 2 uses). Swindler flips Detective results. Researcher chain-kill. Investigator interrogation (Bazras-style).
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [pishrafte.md](pishrafte.md)

---

### Mafia Nights / Shab Mafia (`shab_mafia`)

**Roles:** Godfather, Dr. Lecter (mafia), Joker Mafia, Detective, Doctor, Professional, Hard John, Psychologist, Mayor, Seller, Simple Citizen.
**Day:** `day_vote` → `day_elim` + **last-move elimination card** when player voted out.
**Night:** Mafia team → Dr. Lecter → Joker Mafia → Detective → Professional → Doctor.
**Elimination cards:** Insomnia, Final Shot, Beautiful Mind, Thirteen Lies, Green Mile, Red Carpet.
**Special rules:** Godfather shows as citizen. JokerMafia flips Detective result (max 2 uses). Dr. Lecter (mafia) saves mafia from city shots. `features.lastMove: true`.
**Win:** Mafia ≥ city, or all mafia out.
**Design doc:** [shab_mafia.md](shab_mafia.md)

---

## Role Quick Reference

| Role ID | Team | Night Action | Special |
|---------|------|-------------|---------|
| `mafiaBoss` | Mafia | Shoot | Shows negative to Detective |
| `godfather` | Mafia | Shoot / Sixth Sense / Saul | Shows citizen to Detective. Has vest |
| `danMafia` | Mafia | Shoot + bullet queue | Has antidote vs Herbalist |
| `alcapone` | Mafia | Shoot | No vest |
| `don` | Mafia | Shoot | Betrayal vote in Namayande |
| `matador` | Mafia | Disable player | No same target consecutive nights |
| `magician` | Mafia | Disable player | Same as Matador |
| `saulGoodman` | Mafia | Convert (once per game) | Simple citizen only |
| `negotiator` | Mafia | Convert citizen (once per game) | 1–2 mafia must be out first |
| `nato` | Mafia | Role guess (once per game) | Wakes with Mafia |
| `natasha` | Mafia | Observe player | Learns role if they act |
| `swindler` | Mafia | Flip Detective result | Wakes independently |
| `doctorLecter` | Mafia | Save mafia from city shot | Cannot save from mafia shot |
| `jokerMafia` | Mafia | Flip Detective result | Max 2 uses per game |
| `rebel` | Mafia | Explosion trigger | Triggers when any mafia eliminated |
| `hacker` | Mafia | Block player ability | No same target consecutive nights |
| `witch` | Mafia | Reflect ability back | Wakes with Mafia team |
| `executioner` | Mafia | None | Mafia team member |
| `bomber` | Mafia | Plant bomb (once) | Diffused during day by Guard |
| `zodiac` | Independent | Shoot (even nights only) | Immune to night shot; wins at final 2 |
| `detective` | City | Query player side | Boss/Godfather shows negative |
| `doctor` | City | Save player | No consecutive same; self-save ×1 (×2 in some) |
| `watson` | City | Save player | Same as Doctor |
| `sniper` | City | Shoot once per game | Shoots citizen → Sniper dies |
| `professional` | City | Shoot (2 per game) | Shoots citizen → Professional dies |
| `leon` | City | Shoot (2 bullets) | Has vest; shoots citizen → Leon dies |
| `citizenKane` | City | Mark one player | Mafia → revealed next day + Kane dies at night |
| `constantine` | City | Revive one eliminated | Cannot revive role-revealed players |
| `nostradamus` | Independent | Pick 3 players (intro only) | Chooses side; immune to night shots |
| `researcher` | City | Link to player | Chain-kills linked NATO/Swindler when Researcher dies |
| `investigator` | City | Pick 2 for interrogation | Both survive → interrogation day |
| `guard` | City | Sacrifice for bomb | If Magician disabled → cannot diffuse |
| `ocean` | City | Wake one citizen | Wakes mafia/Zodiac → Ocean dies |
| `gunslinger` | City | Give gun | 1 real + 2 fake; unused real burns |
| `heir` | City | Link to player | Inherits ability if linked player eliminated |
| `herbalist` | City | Poison once per game | Dan Mafia's antidote counters once |
| `armorsmith` | City | Give armor | Armored survives first shot |
| `armored` | City | — | One vest; survives first mafia shot |
| `invulnerable` | City | — | Cannot be killed at night; vote only |
| `guide` | City | Query player | Mafia → reveals Guide's identity |
| `minemaker` | City | Mine at door (once) | Mafia shoot mined → miner and shooter |
| `bodyguard` | City | Protect from Rebel | Rebel tries protected → Rebel dies alone |
| `lawyer` | City | Immunity (once) | Target skips defense vote next day |
| `soldier` | City | Counter-shoot if shot | Shoots citizen → Soldier dies |
| `suspect` | City | — | Always shows positive to Detective |
| `kadkhoda` | City | — | No dedicated action |

---

## Vote Threshold Reference

| Scenario | Defense threshold | Elimination threshold |
|---------|-----------------|----------------------|
| Most scenarios | More than half (>50%) of eligible voters | More than half (>50%) |
| Pedarkhande | Half minus one (≥floor(eligible/2)−1) — "نصف منهای یک" | Half (≥ceil(eligible/2)) — "نصف یا بیشتر". Tie = death lottery |

**Eligible voters** = alive players − the person being voted on (they cannot vote for themselves).

---

## Implementation Map

### Flow Engine (`flow-engine.js`)

| Function | Purpose |
|---------|---------|
| `ensureFlow()` | Initialize/retrieve flow state |
| `nextFlowStep()` | Advance to next step; applies effects at phase boundaries |
| `prevFlowStep()` | Go back; reverts effects |
| `getFlowSteps(f)` | Returns ordered step array for current phase/day |
| `applyDayElimFromPayload(f, payload)` | Apply day elimination; revert with `{ out: null }` |
| `applyNightActionsFromPayload(f, payload)` | Apply all night actions (mafia shot, saves, etc.) |
| `applyEndCardActionForDay(f)` | Apply elimination card effect |
| `revertEndCardActionForDay(f)` | Revert card effect |
| `applyBazrasInterrogationFromPayload(f, payload)` | Apply bazras forced vote |
| `applyNightNegotiatorFromPayload(f, payload)` | Apply negotiator conversion |

### Flow UI (`flow-ui.js`)

| Function/section | Purpose |
|---------|---------|
| `showFlowTool()` | Main renderer — builds `body` HTML for current step |
| `normWake(s)` | Normalize wake-order label to canonical key |
| `sectionFor(wakeLabel)` | Returns HTML for one night role's action form |
| `snapshotNightActionsFromUI(mergeOnly)` | Reads night form values into `draft.nightActionsByNight[nightKey]` |
| `keepRoleInDraw(stepId)` | Returns false if step's role not in draw (filters night steps) |

### Effect Registry (`effect-registry.js`)

All reversible flow step effects are registered here with `registerEffect(stepId, { apply, revert })`. When `nextFlowStep` applies an effect or `prevFlowStep` reverts it, it calls `applyEffect`/`revertEffect` which dispatch to the registered handler.

### Flow Configs (`flow-configs/*.js`)

Each scenario has a config file: `classic.js`, `bazras.js`, `kabo.js`, `namayande.js`, `pedarkhande.js`, `zodiac.js`, `standard.js` (mozaker/takavar/meeting_epic/pishrafte/shab_mafia).

Config shape:
```js
{
  intro_day: ["intro_day_run"],
  intro_night: ["intro_night_run"],
  day: {
    steps: ["day_vote", "day_elim"],  // base day steps
    // OR for dynamic scenarios:
    base: [...], interrogation: [...],  // bazras
    day1: [...], default: [...],         // kabo, namayande
  },
  night: ["night_mafia", "night_doctor", ...],  // one per wake order entry
}
```

---

## Known Gaps / TODO

| Gap | Scenario | Severity | Notes |
|-----|---------|----------|-------|
| **Rebel explosion mechanic** | namayande | Medium | Rebel triggers when mafia eliminated; can explode with one city player before next vote. Bodyguard protects. Not yet implemented in flow-engine or flow-ui. Needs a new dynamic day step. |
| `night_inspector` not in `stepToRoles` | bazras | Low | Step always shown; acceptable since investigator is always in bazras draw. Add `night_inspector: ["investigator"]` to fix cleanly. |
| Hard John, Psychologist, Mayor, Seller | shab_mafia | Low | No dedicated night action; roles exist but are "display only" in the draw. |
| Judge, Commander, Priest | meeting_epic, pishrafte | Low | No dedicated night action in current implementation. |
| Village Chief (kadkhoda) | kabo | Low | In flow config night step but no dedicated action. |
| Night per-role pages vs single page | all | Future | Design doc (`00-night-phases-and-status-check.md`) describes per-role night pages; currently some scenarios still use a single night page. |
| Takavar Commando engine logic | takavar | Medium | Commando counter-shot recorded in UI (fl_commando_shot) but not auto-applied in flow-engine.js at dawn. Moderator must apply manually. |

---

## Design Docs Index

| Scenario | File | Status |
|---------|------|--------|
| Classic | [classic.md](classic.md) | Complete |
| Inspector (Bazras) | [bazras.md](bazras.md) | Complete |
| Representative (Namayande) | [namayande.md](namayande.md) | Complete |
| Negotiator (Mozaker) | [mozaker.md](mozaker.md) | Complete |
| Commando (Takavar) | [takavar.md](takavar.md) | Complete |
| Capo (Kabo) | [kabo.md](kabo.md) | Complete |
| Godfather (Pedarkhande) | [pedarkhande.md](pedarkhande.md) | Complete |
| Zodiac | [zodiac.md](zodiac.md) | Complete |
| Meeting/Epic | [meeting_epic.md](meeting_epic.md) | Complete |
| Advanced (Pishrafte) | [pishrafte.md](pishrafte.md) | Complete |
| Mafia Nights (Shab Mafia) | [shab_mafia.md](shab_mafia.md) | Complete |
| Night phases design | [00-night-phases-and-status-check.md](00-night-phases-and-status-check.md) | Complete |
| Player selection cards | [player-selection-cards.md](player-selection-cards.md) | Complete |
| Effect registry | [effect-registry.md](effect-registry.md) | Complete |

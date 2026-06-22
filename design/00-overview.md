# Game Flow — Overview

This folder holds **human-readable game design documents** — one per scenario — so we can design and debug the Flow separately for each variant. The app is complex and scenario-specific logic is spread across `flow-engine.js`, `flow-ui.js`, and `index.html`; these docs are the single source of truth for *intended* behavior.

---

## Quick reference

- **Phases:** Intro Day → Intro Night → Day 1 ↔ Night 1 ↔ Day 2 ↔ … → Winner
- **Day steps:** Dawn resolution (Day 2+) → scenario steps → Dusk resolution
- **Flow configs** (`flow-configs/*.js`) are the single source of truth for phase and step definitions
- **Vote thresholds, scenario details, architecture:** See **[MASTER.md](MASTER.md)**
- **Night design (per-role pages, resolution):** See **[00-night-phases-and-status-check.md](00-night-phases-and-status-check.md)**

When fixing bugs or adding features, check the **design doc for that scenario** first, then align code with the doc.

---

## Scenario design files (index)

| Scenario ID     | Design file        | Notes |
|-----------------|--------------------|--------|
| classic         | [classic.md](classic.md)     | Standard day vote + elim; mafia, doctor, detective. |
| bazras          | [bazras.md](bazras.md)      | **Mid-Day Nap.** Inspector interrogation → Mid-day → forced vote; sniper/mafiaBoss rule, researcher chain. |
| namayande       | [namayande.md](namayande.md)   | Rep election Day 1; rep action/cover/defense/vote Day 2+. Rebel explosion (partially implemented). |
| mozaker         | [mozaker.md](mozaker.md)     | Negotiator once-per-game citizen conversion; Reporter queries conversion; Mafia Boss immune to Sniper. |
| takavar         | [takavar.md](takavar.md)     | Standard flow with Sniper. |
| kabo            | [kabo.md](kabo.md)          | **Mid-Day Nap.** Day 1: Trust vote → Suspects → Mid-day Sleep → Defense & Shoot; Heir, Herbalist, Armorsmith, Witch. |
| pedarkhande     | [pedarkhande.md](pedarkhande.md) | Godfather sixth sense, elimination cards, Nostradamus. |
| zodiac          | [zodiac.md](zodiac.md)      | Day guns + gun expiry, then vote/elim. Zodiac independent role. |
| meeting_epic    | [meeting_epic.md](meeting_epic.md) | Natasha observation, NATO guess, Dr. Lecter (city-side). |
| pishrafte       | [pishrafte.md](pishrafte.md)   | Large table; all major roles combined. |
| shab_mafia      | [shab_mafia.md](shab_mafia.md)  | Last-move elimination cards; Godfather + Lecter + JokerMafia. |

Use [template.md](template.md) to add a new scenario.

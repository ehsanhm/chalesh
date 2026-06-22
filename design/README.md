# Game design docs

This folder contains **human-readable game flow design** documents — one per scenario — so we can:

- **Design** the intended flow without touching code.
- **Debug** by comparing implementation (`flow-engine.js`, `flow-ui.js`) to the design.
- **Onboard** and discuss rules in one place.

## Structure

- **[00-overview.md](00-overview.md)** — Quick reference and index of scenario design files. Full details in [MASTER.md](MASTER.md).
- **[00-night-phases-and-status-check.md](00-night-phases-and-status-check.md)** — Target design for **night as multiple pages** (one per role wake-up), resolution at end of night, and **Status Check** + back/forward behavior (selections persist; Status Check scoped to current position).
- **[player-selection-cards.md](player-selection-cards.md)** — **UX rule:** use player **cards** instead of dropdowns for choosing players (single or multi-pick); where it’s implemented and how to add new pick-UIs.
- **One file per scenario** (e.g. `classic.md`, `bazras.md`) — Setup, wake order, day steps, night resolution, edge cases, and back-navigation behavior for that scenario. Use the **Conditional effects and timing** section (see `template.md`) for rules that trigger on prior actions (e.g. Kane’s invisible bullet: when applied, flow impact).
- **[template.md](template.md)** — Copy this to add a new scenario or fill in a missing one.

## Usage

1. When fixing a bug: open the scenario’s design file and confirm *intended* behavior, then align code with the doc.
2. When adding a feature: update the design doc first, then implement.
3. When adding a new scenario: add entry in `scenarios.js`, add flow-config in `flow-configs/<scenario_id>.js`, add row in `00-overview.md`, then create `design/<scenario_id>.md` from `template.md`.

These files are the single source of truth for *what should happen*; the code is the implementation.

# Selections: cards over dropdowns/radios

**Status:** Adopted  
**Applies to:** Flow tool (intro night, night steps), any future “pick player(s)” UI.

---

## Rule

**Always use cards for selections — never radio buttons, checkboxes, or dropdowns when a card-based choice is feasible.**

- **Player selection:** Use **player cards** instead of dropdown menus for choosing players.
- **Single choice** (e.g. “Pick one player”): show a grid of **cards** (one per eligible player, plus a “—” option). User taps a card to select; no dropdown + Add/Remove.
- **Multi choice** (e.g. “Pick up to N players”): show a grid of **cards** (one per eligible player). User taps to **toggle** selection; no dropdown + Add button + per-item Remove.

This improves UX: all options are visible at once, fewer taps, and works better on touch devices.

---

## Where it’s implemented

| Context | Type | Notes |
|--------|------|------|
| **Intro night — Nostradamus pick 3** | Multi (3) | Tap cards to pick 3 players; no dropdown + Add/Remove. |
| **Intro night — Nostradamus choose side** | Single | Tap card for Citizens or Mafia; no radio buttons. |
| **Intro night — Heir** | Single | Tap one card for “pick successor”; no dropdown. |
| **Night — Ocean** | Single | Tap one card for “who to add to team tonight”; no dropdown + Add. Team list is read-only; tap “—” to clear. |
| **Night — Nostradamus** | Multi (3) | Same as intro: tap cards to pick 3. |
| **Night — Constantine** | Single | Tap one **dead** player card to revive; no dropdown. |
| **Night — Guide** | Single | Tap one card for Guide target; previous night’s target is shown but disabled (greyed, not clickable). |
| **Other night single-target roles** | Single | Doctor save, Detective query, Mafia shot, Armorsmith armor, etc. use `mkNightTargetCards`. |

---

## Implementation details (for maintainers)

- **Helpers** (in `flow-ui.js`, early in `showFlowTool`):
  - `mkNightTargetCards(fieldId, savedVal, labelText, optionalIndexes, optionalDisabledSet)`  
    Renders a hidden input + a grid of `.nightPlayerCard` buttons. Optional 5th arg = Set (or array) of player indices to show as disabled (e.g. Guide’s “prev night” target).
  - `mkNightMultiPickCards(fieldId, savedArr, maxCount, labelText, indexList, opts)`  
    Multi-select: hidden input value = comma-separated indices; tap toggles. `opts.intro` for intro-night Nostradamus (saves to night `"0"` and applies mafia-count result).
- **Delegated click** (one-time, `document`):
  - **Multi-pick:** if the card’s group has `data-multipick="true"`, parse hidden value, toggle the clicked index (respecting `data-max`), write back, then either intro save or `snapshotNightActionsFromUI` + `showFlowTool`; refresh card styles.
  - **Single-pick:** set hidden input, then special cases: `fl_ocean_wake` (sync `d.oceanTeam` and `d.oceanWakeByNight`), `fl_intro_heir_pick` (save to `nightActionsByNight["0"].heirPick`), else `snapshotNightActionsFromUI`; refresh card styles.
  - Cards with `data-disabled="true"` are ignored (no click).
- **Styling:** Same as existing night cards: `NIGHT_CARD_BASE`, `NIGHT_CARD_IDLE`, `NIGHT_CARD_SEL`; grid 3 columns, scrollable.

---

## Adding new “pick player(s)” UI

1. Prefer **cards** via `mkNightTargetCards` (single) or `mkNightMultiPickCards` (multi).
2. Use a **hidden input** with a stable `id` so existing snapshot/delegate logic can read it (or add a new field and snapshot branch).
3. If you need “cannot pick this player” (e.g. same as last night), pass `optionalDisabledSet` (single) or filter `indexList` (multi).
4. Only use a **dropdown** when the choice set is not “players” (e.g. role names, actions like Shoot / Sixth sense, codes 1–4).

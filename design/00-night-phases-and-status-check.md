# Night phases (per-role pages) and Status Check

This document describes the **target design** for splitting each Night into one page per role wake-up, and how Status Check and back/forward navigation should behave. The current app uses a **single Night page** per night where all roles’ choices are collected together; the goal is to make God’s job easier by giving each wake-up its own page.

---

## Previous state (before per-role night steps)

*Kept for context, migration, and debugging old saves after the new behavior is implemented.*

- **Night** was one phase with **one step** per night (e.g. `night_run`).
- That single step showed one big form: mafia shot, doctor save, bomber, magician disable, zodiac shot, ocean wake, gunslinger give, etc.
- All choices were stored in one `night_actions` event payload (and/or `draft.nightActionsByNight[nightKey]`).
- When advancing from Night to Day, **resolution** ran once: apply mafia shot (with saves), chain kills, sniper, bomb, etc. Results were applied to `appState.draw.players` and recorded in `f.events` / `f.draft`.
- **Status Check** (the event log / phase summary in the Flow UI) shows events grouped by day and phase. It only shows events **up to the current flow position**; “future” that part of the behavior stays the same in the new design.

---

## Target design: Night as multiple steps (one page per role wake-up)

### 1. Night steps = one page per role (or role group)

Instead of one “Night 1” page, the flow should have **multiple steps per night**, one per wake-up in the scenario’s **wake order**. Examples:

- **Night 1 – Mafia team wakes up** → choose shot (and any mafia-only actions, e.g. NATO guess, sodagari).
- **Night 1 – Magician** → disable a player.
- **Night 1 – Bomber** → plant the bomb (target + code).
- **Night 1 – Professional** → shoot a player (if applicable).
- **Night 1 – Doctor** → save a player.
- **Night 1 – Detective** → query a player (result shown only to God).
- … (one step per line in `wakeOrder` or per role that acts at night, depending on scenario).

The exact list of steps is **scenario-dependent** and should be derived from `scenarios.js` wake order (and possibly role-specific rules for “wakes only on even nights”, “intro night only”, etc.).

### 2. What each night-step page contains

- **One (or a small set of) role-specific inputs** — e.g. “Mafia shot” dropdown, “Doctor save” dropdown, “Magician disable” dropdown.
- No need to show every role on one page; God only sees the current wake-up. Selections are **saved as soon as God makes them** (or when leaving the step), so they persist when navigating.

### 3. Storing per-step selections (persist when going back/forward)

- **Draft (or equivalent) per night, per step:** e.g. `draft.nightStepSelectionsByNight[nightKey][stepId]` or `draft.nightStepSelectionsByNight[nightKey]` as an array of `{ stepId, data }`.
- **Important:** These selections are **not** removed when the moderator goes back. They are the “God’s selections on those phase pages” that must be saved. So when God reopens “Night 1 – Mafia”, the previously chosen mafia shot is still there.
- Optionally, events can also store per-step data (e.g. `night_step` with `{ stepId, day, phase: "night", data }`) for the event log; but the **source of truth for re-displaying the form** should be draft (or a store that is **not** pruned by flow position). Only **resolution results** (who died, who was converted, etc.) should be pruned when going back.

### 4. Resolution at end of night (after last night step)

- When God presses **Next** on the **last** night step (e.g. “Night 1 – Detective”), the app:
  1. **Collects** all selections from that night’s steps (from draft / stored payloads).
  2. **Runs resolution** (same logic as today: mafia shot vs doctor save, chain kills, sniper, bomb, NATO, sodagari, etc.) and computes who dies, who is saved, role changes, revives.
  3. **Applies** those results to game state (`setPlayerLife`, role changes, etc.) and writes to `draft` (e.g. `nightMafiaAppliedByDay`, `nightSniperAppliedByDay`, …).
  4. **Records** one or more events for **Status Check** — e.g. a single `night_actions` event with the full combined payload and/or a `night_resolution` event with a short summary (who died, who was converted, etc.). These events are what Status Check displays.

So: **all Night 1 actions and results are recorded and shown in Status Check** only **after** the last Night 1 step is completed.

### 5. Status Check: scope and content

- **Content:** Status Check shows the **recorded** events (day vote, day elim, night resolution, bomb, gun shots, etc.) grouped by day and phase (Day 1, Mid-day 1, Night 1, Day 2, …).
- **Display order:** Saved and shown data must follow the **same order as events happen in the game**, based on the step order in each scenario's flow config (`flow-configs/{scenario_name}.js`). Day steps use `day.steps`; night steps use the `night` array. When recording events, the app stores `stepId` from the current flow step. Status Check sorts events by this order and, for night phase, iterates the flow config's step order to interleave separate events (e.g. `gun_give`, `detective_query`) with `night_actions` content in the correct sequence.
- **Scope:** Only events **up to the current flow position**. So:
  - When the current position is “Night 1 – Doctor”, Status Check does **not** yet show Night 1 resolution (resolution hasn’t run).
  - When the current position is “Day 2 – Vote”, Status Check shows Night 1 resolution (and Day 1, etc.).
  - When the moderator **goes back** from Day 2 to Night 1, the **recorded values** for Night 1 resolution are **removed** from Status Check (and the corresponding deaths/role changes are reverted from game state). So Status Check always reflects “what has happened up to the current step”.

### 6. Back/forward navigation: two kinds of data

| Data | When going back | When showing a phase page |
|------|------------------|----------------------------|
| **Selections (inputs)** | **Kept.** God’s choices on each night-step page (and day steps) must remain saved. | When opening “Night 1 – Mafia”, load and show the saved mafia shot (and any other inputs for that step). |
| **Resolution results (outputs)** | **Removed from Status Check** and reverted from game state for any phase/night that is “after” the new current position. | Status Check only lists events up to current position; applied deaths/role changes for “future” phases are undone. |

So:

- **Going back:** Revert applied deaths/role changes for the night(s) and day(s) we are moving “past”; prune events that are strictly after the new flow position so Status Check updates. Do **not** clear per-step selections (draft or non-pruned store).
- **Going forward again:** When reaching the end of Night 1 again, resolution runs again using the **same** saved selections; the same results are reapplied and Status Check shows Night 1 again.

### 7. Implementation notes (for later)

- **getFlowSteps(f)** for `phase === "night"`: Instead of returning a single step `night_run`, return one step per role (or role group) from the scenario’s wake order, e.g. `[{ id: "night_mafia", title: "…" }, { id: "night_magician", title: "…" }, …]`. Step ids can be derived from wake order (e.g. first entry → `night_mafia`, second → `night_magician`, …) or from a new config shape (e.g. `nightSteps` in scenario config).
- **flow-ui.js:** For each `cur.id` (e.g. `night_mafia`, `night_doctor`), render a small form with only the relevant inputs. Read/write from `draft.nightStepSelectionsByNight[nightKey][stepId]` (or equivalent).
- **Resolution:** When leaving the **last** night step, gather all `draft.nightStepSelectionsByNight[nightKey]` into one combined payload, call the same resolution logic that today runs on the single `night_actions` payload, then apply and record events. Optionally keep emitting one `night_actions` event (with combined data) so existing Status Check rendering keeps working.
- **Pruning:** Keep using `pruneEventsForward(f)` so that events (and thus Status Check) only include events up to `(f.phase, f.day, f.step)`. For night, “position” may need to account for step index within the night (e.g. “Night 1 step 3” is before “Night 1 resolution”, so resolution event is only included when current position is past the last night step). So `flowLogicalTime` might need to be step-aware within night, or resolution events might be stored with a flag so they are only shown when the flow has advanced past that night entirely.

---

## Summary

- **Night** = multiple **steps** (one page per role wake-up). Order = scenario wake order.
- Each step **saves** God’s selections; those **persist** when navigating back/forward.
- **After the last night step**, resolve all actions → apply deaths/role changes/revives → record results for **Status Check**.
- **Status Check** shows only events **up to current flow position**; going back removes “future” results and reverts game state, but **selections on phase pages stay saved** so God can go back and forth and see consistent form values and a correct Status Check.

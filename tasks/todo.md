# Session Tasks

## End Card UX Overhaul (this session)

- [x] `day_end_card_pick` step: show face-down shuffled cards, moderator picks one
- [x] Square cards on pick page (aspect-ratio:1)
- [x] Card order shuffled (seeded by day) so position doesn't reveal identity
- [x] Available cards list sorted alphabetically (different order from displayed cards)
- [x] Card selection persists on pick step — user must click Next to advance (no auto-advance)
- [x] `day_end_card_{cardId}` action step appears after pick step (always, independent of pick step)
- [x] Beautiful Mind: always show action page even when Nostradamus is voted out (self-pick allowed)
- [x] Beautiful Mind self-pick: player survives, night shield destroyed
- [x] Status check: correct message for self-pick ("returned but shield destroyed")
- [x] Pedarkhande elimination threshold: `ceil(n/2)` ("half or more votes")
- [x] Fix end card step ordering: pick → action → dusk (snapshot filter strips and re-appends)
- [x] Fix revert: back from action step clears card selection so pick step reappears
- [x] Fix revert: back from BM action → pick step → day_elim → day_vote (three prevFlowStep calls)

## Dusk / Dawn role display

- [x] Day Result (Dusk): show player roles alongside names
- [x] Night Result (Dawn): show player roles alongside names

## Test fixes

- [x] Fix 11 failing end-card-action tests
- [x] Fix missed `pickStep ? (getEndCardActionStepForDay(f) || null)` instance in `end_card_action` placeholder loop
- [x] Update revert tests to use `f.step = 3` and 3 `prevFlowStep()` calls
- [x] Update "Beautiful Mind: no action step when Nostradamus draws it" → assert step IS shown

## General input persistence

- [x] Generic save/restore for all `select`, `input`, `textarea` form elements across all flow steps
- [x] Saves on `change` + `input` events (delegated listener, replaced on each render)
- [x] Saves before Next and Back navigation
- [x] Saves on modal close (`__flowOnClose`)
- [x] Restores saved values after each render

## Review

All tasks completed. Key files changed: `flow-engine.js`, `flow-ui.js`, `flow-configs/dusk.js`, `flow-configs/dawn.js`, `scenarios.js`, `index.html`, `tests/end-card-action.test.js`, `tests/revert-flow-actions.test.js`.

---

## Documentation & Scenario Audit (current session)

- [x] Fix card selection persistence on pick step (don't clear byDay on back-nav from pick/action steps)
- [x] Fill in all incomplete design docs: `kabo.md`, `namayande.md`, `mozaker.md`, `takavar.md`, `pishrafte.md`, `shab_mafia.md`, `meeting_epic.md`
- [x] Create centralized `design/MASTER.md` — single-document reference for all scenarios, roles, phases, implementation map
- [x] Update `design/00-overview.md` — link to MASTER.md, remove "To be written" stubs
- [x] Fix `night_inspector` missing from `stepToRoles` in `flow-ui.js`

## Known gaps (for future sessions)

- [ ] Rebel explosion mechanic in namayande — needs new dynamic day step + engine logic
- [ ] Night per-role pages vs single night page (see `00-night-phases-and-status-check.md`)
- [ ] Judge, Commander, Priest, Hard John, Psychologist, Mayor, Seller — no dedicated night actions

---

## Takavar night/day flow fixes (current session)

- [x] Fix Guardian/Hostage-Taker/Commando night steps showing "No action to record" — missing entries in `wakeRoleMap2`
- [x] Fix Takavar day_guns? step not appearing — add `day_guns?` etc. to `standard.js` FLOW.takavar.day + `scenarios.js` dayPhaseConfig.steps
- [x] Fix Mafia + NATO both showing simultaneously — add Takavar-specific dropdown selector for godfatherAction
- [x] Audit target card visibility: dead players hidden for roles that don't need them; self excluded where appropriate; mafia-only targets for city roles
- [x] Fix JokerMafia: allow self-targeting (strategically flips detective's inquiry on them)
- [x] Fix `mafiaActuallyShot` not excluding `nato_guess` — status check wrongly showed shot when Mafia used NATO
- [x] Add NATO-as-godfatherAction message to status check mafia block
- [x] Add guardian/hostageTaker/commando/gunslinger blocks to `describeNightActions` in index.html
- [x] Fix day_guns "only one shooter": Takavar gunslinger night step now shows dual picker (real bullet + fake bullets) that auto-updates f.guns

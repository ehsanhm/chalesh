# Lessons Learned

## End Card Flow (pick → action step)

**Pattern**: When two steps are always shown together (pick + action), making one disappear based on state
causes auto-advance UX because `f.step` still points to the same index.
**Rule**: Keep both steps in the flow at all times. The pick step stays visible (showing selected card
highlighted) and the user must click Next to advance to the action step.

**Pattern**: `replace_all` on Edit tool misses variants with extra wrapping like `(fn() || null)`.
**Rule**: After a `replace_all`, always grep for the old pattern to verify all instances were caught.

## `getEndCardActionStepForDay` independence

**Pattern**: Chaining `const endCardStep = pickStep ? getEndCardActionStepForDay(f) : null;` means
if `pickStep` is null (no `dayElimAppliedByDay`), the action step never appears — breaking tests that
set up `byDay` directly without `dayElimAppliedByDay`.
**Rule**: `getEndCardActionStepForDay` should always be called independently. It checks `byDay[dayKey].cardId`
directly and doesn't need `pickStep` as a gate.

## Test step indices after flow changes

**Pattern**: When a new step is inserted into the flow (e.g., `day_end_card_pick` before `day_end_card_BM`),
tests that hard-code `f.step = 2` break because the index shifts.
**Rule**: When inserting steps, update ALL tests that set `f.step` for affected steps. Also update
snapshots in `dayStepsByDay` to include the new step id.

## `prevFlowStep` revert call count

**Pattern**: The pick step has no game-state revert (it just clears the card selection). Going backward
through pick → day_elim requires an EXTRA `prevFlowStep()` call compared to the old no-pick-step flow.
**Rule**: Revert tests for end-card actions need 3 `prevFlowStep()` calls: BM action → pick step → day_elim → vote.

## Dusk / Dawn step renderers

**Pattern**: `flow-configs/dusk.js` and `dawn.js` receive `ctx` with `draw`, `ROLE_I18N`, `names`.
Role name: `ROLE_I18N[draw.players[idx].roleId].name`.
**Rule**: Always use `draw && draw.players` guard since draw can be null in edge cases.

## Shuffled card display

**Pattern**: Using `Math.random()` for card shuffle causes cards to jump positions on every re-render.
**Rule**: Use a seeded RNG (day number × LCG constant) for deterministic but per-game shuffle.
The available cards list should be sorted DIFFERENTLY (alphabetically) so position doesn't reveal identity.

## Generic input persistence

**Pattern**: Night actions use `snapshotNightActionsFromUI` for persistence. Other steps (especially
custom step renderers) have no save mechanism — selections are lost on re-render.
**Rule**: Add a delegated `change`+`input` listener on `toolBody` that saves all non-hidden form elements
to `f.draft.stepInputs[stepId][key]`. Restore after each `openToolModal` call. Save before navigation
in both fl_prev and fl_next handlers.

## Flow is a unidirectional timeline — back-nav must never erase selections

**Pattern**: Clearing `byDay[dayKey]` (or any draft field) when going Back from a later step
erases the moderator's selection on an earlier step. The pick step lost its card selection
because `prevFlowStep` cleared `byDay[dayKey]` when leaving the action step or the pick step.

**Rule**: Going backward from step N to step N-1 must NEVER modify state that belongs to
step N-1 or earlier. The flow is a timeline: earlier pages affect later pages, never vice versa.
Only clear state when leaving the step that OWNS that state (i.e., when its own "apply" is reverted).

Concretely for end-card pick:
- Reverting `day_elim` (back past day_elim → day_vote) → clears `byDay[dayKey]`. ✓
- Back from action step → pick step → only revert the action effect; keep `byDay[dayKey]`. ✓
- Back from pick step → day_elim → no state change at all; keep `byDay[dayKey]`. ✓

**General rule**: A step's draft/state is cleared only when its OWN "apply" is reverted.
Never clear state owned by a step you're navigating TO.

## CLAUDE.md workflow compliance

**Rule**: Always create `tasks/todo.md` at session start with planned work.
After any user correction, update `tasks/lessons.md` immediately.
Do not wait until the end of the session to create these files.

## wakeRoleMap2 vs wakeToRoleIds — different purposes

**Pattern**: There are TWO role-lookup maps: `wakeRoleMap2` (for `wakeActors()` — determines if a role has anything to display in a night step), and `wakeToRoleIds` (for disable-state lookup). Missing entries in `wakeRoleMap2` show "No action to record." even if `sectionFor` has logic for that role.
**Rule**: When adding a new night role (guardian, hostageTaker, commando, etc.), add entries to BOTH maps.

## Takavar gun distribution — f.guns requires explicit population

**Pattern**: `day_guns` `shooterOpts` only shows players in `f.guns`. If the moderator only gives the real gun during the gunslinger night step, fake holders never appear in the shooter dropdown.
**Rule**: For Takavar, the gunslinger night step must use a dual picker (real bullet + fake bullets multi-select) that auto-populates `f.guns` for all holders. The generic one-at-a-time give form works for Zodiac but is inadequate for Takavar where multiple guns are distributed each night.

## describeNightActions: every elimination needs a cause line

**Rule**: For every player that appears in "Eliminated:" in the status check, there must be a matching action line above naming them as a target. When adding a new role with a kill ability, always add a `shouldAddRole` block in `describeNightActions` in `index.html`.

## normWake ordering — compound names before generic labels

**Rule**: In `normWake`, always check compound/specific role names BEFORE generic team labels. "جوکر مافیا" contains "مافیا", so the `jokermaf` check must come before the `mafia` check. Similarly "دکتر لکتر" → "لکتر" before "دکتر".

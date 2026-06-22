# Effect Registry

**Purpose:** Centralize apply/revert logic for flow steps so fixes don't create new bugs elsewhere.

Each step that changes game state registers `{ apply, revert }` in `effect-registry.js`. The flow engine calls `applyEffect(stepId, ctx)` and `revertEffect(stepId, ctx)` instead of direct function calls.

**Implementation:** See `effect-registry.js` — API, registered effects table, and `makeElimEffect` helper for day_elim/namayande_vote/kabo_shoot.

**Adding a new effect:** Register in `effect-registry.js`, then in `flow-engine.js` call `revertEffect("step_id", { f })` instead of direct revert. Add a revert test in `tests/revert-flow-actions.test.js`.

**Testing:** Open `tests/run.html` in a browser. When fixing a bug, add a test that reproduces it first, then fix.

# Fair Role Assignment — Design

**Status:** Design  
**Feature:** Replace random card-picking with pre-assigned roles based on past game history to balance mafia/city distribution and role variety.

---

## Problem

- Some players repeatedly get "lucky" roles (citizen, detective, doctor)
- Others repeatedly get mafia
- No history or fairness; pure random

---

## Solution Overview

1. **Pre-assign** roles to players using weighted algorithm (fairness-aware)
2. **Reveal** mode: Cards step shows each player their pre-assigned role (no picking)
3. **Persist** history: After each game, record who got which role (by player name)
4. **Weight** assignment: Reduce mafia chance for recent mafia; increase doctor/detective chance for players who haven't had them

---

## Target Distribution (per game)

- **~30% mafia** / **~70% city** (or **~10% independent**, ~30% mafia, ~60% city if scenario has independent)
- Actual counts come from scenario setup (mafiaCount, toggles); we only influence *who* gets which role

---

## Algorithm (weighted sequential assignment)

**Input:** role pool (from `buildRolePool`), player names, history

**Output:** `assignment[playerIdx] = roleId` (or equivalently: `deck` order where `deck[i]` is role for `players[i]`)

**Steps:**
1. Load history: `history[playerName] = { mafiaCount, gamesPlayed, roleCounts: { doctor: 0, detective: 1, ... } }`
2. For each role in pool (shuffled to avoid bias by role order):
   - Compute weight for each available player: `w(P, R) = weightForRole(R, P, history)`
   - Pick player with probability ∝ weight (weighted random)
   - Assign role R to player P; remove P from available set
3. Return assignment

**Mafia assignment:** Process all mafia roles first. For each mafia role: sort available players by (mafiaCount, lastGamesWereMafia, i). Find the tier (all with same minimal mafiaCount and lastGamesWereMafia). Pick the one at position `(rotation + mafiaPickIndex) % tierSize` — rotates who gets mafia when tied. Rotation increments each game. Non-mafia roles use weighted random (1/(1+0.2*had)).

**Names:** Use exactly what the user enters. No merging or translation between name variants.

**Record on new deal:** History is recorded when (1) the winner screen is shown, or (2) the user starts a new deal — so we record the previous game even if they didn't play to winner. This prevents "empty history" skew (which would always assign mafia to the same seat positions).

**Weight functions (non-mafia roles):**
- **City special roles (doctor, detective, etc.):** `w = 1 / (1 + 0.2 * had)` — gentle inverse: fewer times had role → higher weight
- **Citizen (simple):** `w = 1` (baseline)
- **Independent:** same as city specials

**Consecutive mafia penalty:** If `lastGameWasMafia` and maybe `lastTwoGamesMafia`, multiply mafia weight by extra factor (e.g. 0.2)

---

## Per-role coverage (implemented in `mafia-role-assigner.js`)

After **who is town vs non-town** is fixed (fair-share deficit for bad side), each **concrete role slot** (godfather, citizen, watson, …) is assigned with weighted random **without** replacement inside each group.

1. **Recency:** Recently had the **same** `roleId` → lower weight (same-role penalty + decay).
2. **Fair share per role:** Over the last `balanceWindow` games, if this `roleId` appears `k` times in the **current** pool, each player’s expected count of that role is `(g × k) / n`. Players **below** that expectation get a **higher** weight for this slot; players **above** get a **lower** weight. This pushes everyone toward having played **almost every** role in the pool over a modest number of games, with randomness from weighted picks and shuffled slot order.

Config: `roleCoverageMode`, `roleCoverageBoost`, `roleCoveragePenalty` (see `mafia-role-assigner.js`).

---

## History Schema (localStorage)

Only the **last 50 games** per player are kept to limit storage and weight recent history.

```javascript
{
  "PlayerName1": {
    recentGames: [{ roleId: "mafia" }, { roleId: "doctor" }, ...]  // newest at end, max 50
  },
  ...
}
```

Stats (mafiaCount, lastGamesWereMafia, roleCounts) are derived from `recentGames` when computing weights.

**Update:** When game reaches winner phase, append to `recentGames` and trim to 50.

---

## UX Changes

### Cards step

**Current:** "بازیکن یک کارت را انتخاب می‌کند و نقش خودش را می‌بیند" — player picks a card, sees role

**New (fair mode):** "نوبت: [PlayerName]" — show one card (face-down or single card), click to reveal. Or: show "Your role: [Role]" directly. No card grid — just "Reveal your role" button per player. God taps to advance to next player.

**Simpler variant:** Keep card grid visually but cards are pre-assigned: card 0 = player 0's role, etc. So we show "نوبت: Player1" and the single card they "have" is highlighted. Click = reveal. Same flow, different assignment logic.

Actually: the simplest is — we still have N cards. But instead of player picking which card, we've pre-mapped: `player[i]` gets the role that was fairly assigned to them. So we can keep the same UI: "نوبت: Player1", show N cards but only one is "theirs" — the one at position `assignment[i]`. When they click it, they see their role. The "pick" becomes meaningless — we could highlight the one card that's theirs, or show a single card. To minimize change: we assign `deck` such that `deck[cardIdx[i]]` = role for player i. So we need a permutation: which card index corresponds to which player. Currently deck is shared and players pick. With pre-assign: we have `playerRole[i]` = role for player i. We can put `playerRole[i]` in `deck[i]` (so card i has the role for player i). Then when it's player i's turn, they "pick" card i (the only one that matters). So we just need to ensure the UI shows "your card" — we could gray out or hide the others, or show only one card per turn. Simplest: show one card per player turn, that card has their role. So we render one card, they click to reveal. Same `onPickCard(0)` effectively since there's only one card to "pick".

Let me refine: **Option A** — One card per turn. When it's player i's turn, show a single face-down card. Click = reveal = openRoleModal. No grid.  
**Option B** — Keep grid of N cards, but only one is active (the one for current player). Others are disabled. Visually similar to now.

Option A is cleaner for "reveal" semantics. Let's go with: when fair mode is on, show a single card (or a clear "نقش شما" / "Your role" card) per turn. Click to reveal.

---

## Toggle: Fair Assignment

- Add toggle in Setup or Players step: "توزیع عادلانه نقش" / "Fair role distribution"
- When ON: use fair assignment, reveal-only cards UI
- When OFF: current behavior (random pool, pick cards)

**Clear history:** Help (راهنما) modal includes a control to remove `mafia_v2_fairness_history_v2` from localStorage so fairness starts fresh (e.g. new group).

---

## When to Record History

- When game ends (winner phase shown) — we have `draw.players` and `playerNames`
- Or: when user starts a *new* game (clicks "شروع بازی") — we can record the *previous* game's outcome if it had a winner
- Safer: record when transitioning to winner. But `showCast` is shown after cards... We need a moment when we know the game "finished". Currently that's when we're at winner phase in the flow. We could hook into that.
- Simpler: record when user clicks "شروع بازی" (new game) — at that moment, if there was a previous `appState.draw` with players who had roles and we reached winner, record it. But we might have cleared draw already.
- Best: record in two places: (1) when advancing TO winner phase (in flow), (2) or when loading a saved game that's at winner — no, that's complex.
- Practical: record when `prevFlowStep`/`nextFlowStep` lands on winner, or when flow tool shows winner. Or: add a `recordGameOutcome()` that we call when we enter winner phase. Where does that happen? In flow-engine when phase becomes "winner". We'd need to call a global or hook. Easiest: in `showFlowTool` or flow-ui when we render the winner step, call `recordFairnessHistory(appState)` if fair mode was used. We need to store `fairAssignmentUsed` in draw so we know.

Actually: we should record every game's outcome for fairness purposes, not just when fair mode was used. Because the history is used for future fair assignments. So we always record when a game completes (reaches winner), regardless of whether that game used fair mode. The fair mode only affects how we *assign* the next game.

So: **record when we show/enter winner phase**. In flow-ui or index.html, when rendering winner, call `recordFairnessHistory()`.

---

## Implementation Order

1. Add `FAIRNESS_HISTORY_KEY`, load/save helpers
2. Add `recordFairnessHistory(draw, playerNames)` — appends to history
3. Add `buildFairAssignment(pool, playerNames)` — returns `assignment[]` (playerIdx → roleId)
4. In `startDeal`: if fair toggle ON, call `buildFairAssignment` and pre-fill `draw.players` with roles; set `deck` to match (deck[i] = assignment[i]); change cards UI to reveal-only (one card per turn)
5. Add fair toggle in Setup
6. Hook `recordFairnessHistory` when entering winner phase
7. i18n strings

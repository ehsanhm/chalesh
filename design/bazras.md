# Bazras (Inspector / بازپرس) — Game Flow Design

**Scenario ID:** `bazras`  
**Display name:** Inspector / بازپرس

---

## Setup

- **Default table:** 10 players, 3 mafia.
- **Allowed roles:** Mafia Boss, NATO, Swindler, Detective, Doctor, Investigator (Inspector), Researcher, Sniper, Invulnerable.
- **Default toggles:** Mafia Boss, NATO, Swindler, Detective, Doctor, Investigator, Researcher (Sniper and Invulnerable off by default).

---

## Wake order (Intro Night)

1. Researcher  
2. Mafia team  
3. Charlatan (Swindler)  
4. Doctor  
5. Sniper  
6. Detective  
7. Inspector (Investigator)  

---

## Day phase — special structure

Bazras **replaces** the standard day with a custom sequence when the Inspector’s interrogation is active. It includes a **Mid-Day Nap** step.

**When interrogation is active** (Inspector picked two players the previous night and both survived to morning):

1. **bazras_interrogation** — Interrogation segment. Two picked players each speak twice. No liking/disliking. Optional: talk timer.
2. **bazras_midday** — **Mid-Day Nap** (چرت روز). Moderator chooses: **Cancel** (no elimination) or **Continue** (go to forced vote). No one dies in this step; it only records the decision.
3. **bazras_forced_vote** — Vote only between the two interrogated players. Record votes per player; one is eliminated. This elimination is applied when advancing to the *next* step (or on Next). Store in `draft.bazrasInterrogationByDay[dayKey]`.
4. **day_vote** — Normal day vote (full table).
5. **day_elim** — Normal day elimination.

**When interrogation is not active** (no interrogation this day), day steps are just:

- **day_vote** → **day_elim**

**Vote thresholds (day_vote / day_elim):**

- Document here if Bazras uses different rules. Default: **more than half** for both defense and elimination (same as Classic).

**Flow engine:** Day steps are built dynamically. If `draft.dayStepsByDay[dayKey]` exists (from a previous step), use it; else if interrogation is pending, use bazras steps then day_vote/day_elim; else use only day_vote/day_elim.

---

## Night phase

- **Investigator (Inspector):** Picks **two** players for interrogation. Stored in night_actions (e.g. `investigatorTargets` or similar). If both are alive next morning, next day gets interrogation sub-steps.
- **Researcher:** Links to one player. In Bazras, if Researcher is killed by mafia and linked player is NATO or Swindler, linked player **also dies** (chain kill). If linked is mafiaBoss, mafiaBoss does *not* die.
- **Sniper:** One shot per game. **Bazras rule:** If sniper shoots **mafiaBoss**, **no one** dies (no_effect_boss). If sniper shoots NATO/Swindler/plain mafia (and no doctor save), that player dies.
- **Sodagari (mafiaBoss trade):** Once per game, mafiaBoss can sacrifice self and convert one eligible citizen/invulnerable to mafia. Implemented as special night/conversion flow; UI block only when `scenario === "bazras"`.

Resolution (when moving to next phase):

- Apply mafia shot (with doctor/lecter save, NATO guess rules).
- Apply researcher chain kill only if mafia killed the researcher and scenario is bazras (and linked is nato/swindler/mafia; not mafiaBoss).
- Apply sniper shot with bazras mafiaBoss rule: target mafiaBoss → no kill.
- Apply interrogation forced-vote elimination when leaving `bazras_forced_vote` (or on Next).

---

## Back-navigation

- Reverting the night that applied mafia kill must also revert researcher chain kill if it was applied (`chainKilled`, `chainPrevAlive`).
- Reverting a day that had bazras_forced_vote must revert the forced-vote elimination stored in `bazrasInterrogationByDay[dayKey]`.

---

## Role overrides (short)

- **Doctor:** Can save self twice in whole game (Bazras override).
- **Swindler:** Can target same player two nights in a row (Bazras override).
- **Sniper:** As above (mafiaBoss no-effect; NATO/Swindler/mafia killable).
- **Investigator:** Two targets per night; if both survive, interrogation next day.
- **Researcher:** Link-kill rules for NATO/Swindler/mafia (not mafiaBoss).

---

## Edge cases / notes

- Researcher link display in god view: only show “chain” info when linked role is NATO or Swindler (`linkedRoleId !== "nato" && linkedRoleId !== "swindler"` → hide).
- Interrogation “pending” is derived from previous night’s investigator targets and morning survival; if one of the two died at night, no interrogation that day.

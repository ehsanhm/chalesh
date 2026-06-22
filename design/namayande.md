# Namayande (Representative) — Game Flow Design

**ID:** `namayande` · **Name:** Representative / نماینده

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Don** (دن مافیا) | Leader. Shows negative to any inquiry. Decides night shot. Can use "betrayal vote" (رأی خیانت) once per round to shift a vote count for a representative candidate (cannot use on self). |
| **Rebel** (یاغی) | Mafia enforcer. Wakes with Mafia team. Special trigger: when any mafia member (Don, Hacker, or NATO) is eliminated, Rebel's trigger activates — Rebel can explode before the next first vote, taking one city player with them. Target is protected if: (a) Bodyguard is protecting them or (b) target is the Bodyguard themselves → Rebel dies alone in those cases. |
| **Hacker** (هکر) | Wakes first each night (before Mafia team). Blocks one player's night ability for that night. Cannot target same player on consecutive nights. Wakes independently (before Mafia). |
| **NATO** (ناتو) | Mafia member. Once per game guesses a player's role; if correct, that player is eliminated at dawn. |

### City team

| Role | Description |
|------|-------------|
| **Doctor** (پزشک) | Saves one player each night from mafia shot. Cannot save same person two consecutive nights. Self-save allowed twice per game (namayande override). |
| **Guide** (راهنما) | Each night picks one player. Cannot repeat target on consecutive nights. If target is mafia → that mafia player learns Guide's identity. If target is citizen → host reveals alignment (inquiry result) to Guide. Result shown only to moderator. |
| **Minemaker** (مین‌گذار) | Once per game: places a mine at one player's door. If mafia shoots that player, the mine explodes and the shooting mafia member also dies. Minemaker cannot repeat the mine placement. |
| **Bodyguard** (محافظ) | Each night protects one player from Rebel's explosion. If Rebel tries to explode with Bodyguard's protected player or the Bodyguard themselves → Rebel dies alone (no city casualty). |
| **Lawyer** (وکیل) | Once per game: selects one player to grant immunity. That player cannot enter the defense phase the following day even if they receive enough votes (the votes do not count for defense entry). |
| **Soldier** (سرباز) | Citizen with night action: if mafia shoots Soldier, Soldier can counter-shoot one player. If counter-shot hits mafia → that mafia dies. If hits citizen → Soldier also eliminated. |
| **Simple Citizen** (شهروند ساده) | No night ability. |

---

## Intro Day

Everyone awake. Each player speaks briefly; introduction round. No challenge permitted during intro day.

---

## Intro Night

Wake order: Hacker → Mafia team (Don) → Guide → Doctor → Bodyguard → Soldier → Minemaker → Lawyer.

Intro night: roles wake to learn team identities. No actions on intro night (Guide does not query, Hacker does not block, etc.).

---

## Day — special structure

### Day 1

Flow step: `namayande_rep_election`

- **Representative Election** — Players vote to elect two representatives for the coming days. The two elected players become "rep 1" and "rep 2". Stored in `draft.representatives`.

### Day 2+

Flow steps: `namayande_rep_action` → `namayande_cover` → `namayande_defense` → `namayande_vote`

1. **Rep Speeches & Targets** (`namayande_rep_action`) — Each representative selects one player to accuse (target). Both reps speak for ~20 seconds each, then their target defends briefly. Don's betrayal vote can be applied here (shifts vote counts).
2. **Cover Selection** (`namayande_cover`) — The covers of each rep's target (players who will speak in their defense) are nominated.
3. **Final Defense** (`namayande_defense`) — Covers speak, then targets respond.
4. **Vote** (`namayande_vote`) — Voting between the two targeted players (or standard table vote). Player with enough votes is eliminated. Rebel trigger activates if a mafia player was just eliminated.

**Vote thresholds:** More than half of eligible voters for elimination.

**Rebel trigger:** Whenever a mafia player (Don, Rebel, Hacker, NATO) is eliminated during `namayande_vote` or the day, Rebel's explosion can happen before the next first vote (if Rebel is still alive).

---

## Night (each night)

Order: Hacker → Mafia team → Guide → Doctor → Bodyguard → Soldier → Minemaker → Lawyer

1. **Hacker** — Blocks one player's night ability (cannot repeat consecutive nights).
2. **Mafia team** — Don picks night shot. Don may use NATO's once-per-game guess. Don applies betrayal vote for next day.
3. **Guide** — Picks one player (no repeat consecutive). If mafia → mafia learns Guide's identity. If citizen → Guide gets inquiry result.
4. **Doctor** — Saves one player (no consecutive repeat; self-save twice per game).
5. **Bodyguard** — Protects one player from Rebel explosion.
6. **Soldier** — If shot by mafia, counter-shoots (resolved at dawn).
7. **Minemaker** — Once per game places mine at one player's door.
8. **Lawyer** — Once per game grants next-day vote immunity to one player.

**At dawn:** Apply mafia shot (doctor save if applicable). Apply Minemaker mine explosion if triggered (mine kills shooting mafia member). Apply Soldier counter-shot. Apply Guide results (stored for moderator view).

---

## Win condition

- **Mafia wins** when mafia count ≥ city count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 10 players, 3 mafia (Don, Rebel, Hacker). 12 players adds NATO (mafia) + Soldier (city).
- No end-cards, no lastMove.
- Day 1 only has the representative election step; Day 2+ has the full rep flow.
- Rebel explosion happens in day phase (before vote), not at night.
- **Back-navigation:** Reverting `namayande_vote` restores eliminated player. Reverting night restores night deaths.

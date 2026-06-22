# Meeting / Epic — Game Flow Design

**ID:** `meeting_epic` · **Name:** Meeting/Epic / میتینگ/اپیک

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Mafia Boss** (رئیس مافیا) | Leader. Shows negative to Detective. Decides night shot. |
| **NATO** (ناتو) | Once per game, guesses one player's role. If correct → that player eliminated at dawn. Wakes with Mafia team. |
| **Natasha** (ناتاشا) | Wakes before Mafia. Each night observes one player; learns their role if they have a night action that fires. Wakes independently (before Mafia team). |
| **Simple Mafia** (مافیا ساده) | No night action. |

### City team

| Role | Description |
|------|-------------|
| **Dr. Lecter** (دکتر لکتر) | Mafia doctor turned city asset in some variants. In this scenario: city-side. Saves one player from mafia shot each night. (Or follow implementation — check `flow-ui.js`.) |
| **Detective** (کارآگاه) | Queries one player each night. Boss = negative. |
| **Doctor** (پزشک) | Saves one player each night. No consecutive same saves. Self-save once per game. |
| **Sniper** (تک‌تیرانداز) | One shot per game. If shoots citizen → Sniper eliminated. |
| **Armored** (زره‌پوش) | Has one vest: survives first mafia shot. |
| **Judge** (قاضی) | Special citizen. No dedicated night action in current implementation. |
| **Commander** (فرمانده) | Special citizen. No dedicated night action in current implementation. |
| **Priest** (کشیش) | Special citizen. No dedicated night action in current implementation. |
| **Simple Citizen** (شهروند ساده) | No night ability. |

*(Note: In the Meeting/Epic scenario, Dr. Lecter is on the city side — different from Advanced/Pishrafte where it's mafia. Follow implementation in `flow-ui.js` for current behavior.)*

---

## Intro Day

Everyone awake. Introduction round. No challenge in intro phase.

---

## Intro Night

Wake order: Natasha → Mafia team (Boss/NATO) → Dr. Lecter → Doctor → Detective → Sniper.

Roles wake to learn identities. No night actions.

---

## Day (each day)

Flow steps: `day_vote` → `day_elim`

Standard day: discussion, vote for defense (more than half), elimination vote (more than half).

No mid-day nap.

---

## Night (each night)

Order: Natasha → Mafia team → Dr. Lecter → Doctor → Detective → Sniper

1. **Natasha** — Observes one player; learns role if they act that night.
2. **Mafia team** — Boss picks night shot. NATO uses once-per-game guess if desired.
3. **Dr. Lecter** — Saves one player from mafia shot (city-side save).
4. **Doctor** — Saves one player.
5. **Detective** — Queries one player.
6. **Sniper** — Once-per-game shot.

**At dawn:** Apply mafia shot. Apply Dr. Lecter / Doctor saves. Apply NATO guess. Apply Sniper shot. Apply Natasha observation.

---

## Win condition

- **Mafia wins** when mafia count ≥ city count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 12 players, 4 mafia.
- No end-cards, no lastMove.
- Standard day/night flow. Natasha and NATO make this more complex than Classic.
- **Back-navigation:** Reverting night restores deaths and NATO conversion.

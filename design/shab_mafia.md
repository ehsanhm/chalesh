# Shab Mafia (Mafia Nights) — Game Flow Design

**ID:** `shab_mafia` · **Name:** Mafia Nights / شب مافیا

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Godfather** (پدرخوانده / آل کاپون) | Leader. Shows as citizen (negative) to Detective. Decides night shot. |
| **Dr. Lecter** (دکتر لکتر) | Mafia doctor; saves one mafia member per night from Professional/Sniper shot. Cannot save from city kills. |
| **Joker Mafia** (جوکر مافیا) | Once per game (up to 2 uses total), flips a Detective's query result for that night. |
| **Simple Mafia** (مافیا ساده) | No night action; helps Godfather decide shot. |

### City team

| Role | Description |
|------|-------------|
| **Detective** (کارآگاه) | Queries one player each night. Godfather always shows negative. |
| **Doctor** (پزشک) | Saves one player each night. No consecutive same-person saves. Self-save once per game. |
| **Professional** (حرفه‌ای) | Two shots per game at night. If shoots a citizen → Professional eliminated. |
| **Hard John** (هارد جان) | Special citizen. No dedicated night action in current implementation. |
| **Psychologist** (روانشناس) | Special citizen. No dedicated night action in current implementation. |
| **Mayor** (شهردار) | Special citizen. No dedicated night action in current implementation. |
| **Seller** (فروشنده) | Special citizen. No dedicated night action in current implementation. |
| **Simple Citizen** (شهروند ساده) | No night ability. |

---

## Elimination cards (حرکت آخر / Last Move)

`features.lastMove: true`. When a player is voted out, one elimination card is drawn.

| Card | Effect |
|------|--------|
| **Insomnia** (بی‌خوابی) | Eliminated player stays awake during next night to observe who wakes (information only; cannot act). |
| **Final Shot** (شلیک نهایی) | Eliminated player shoots one player: if mafia → that mafia dies; if citizen → both die. |
| **Beautiful Mind** (ذهن زیبا) | Eliminated player guesses one specific role. If correct → guesser survives with their role; target eliminated. |
| **Thirteen Lies** (دروغ سیزده) | Eliminated player can make one false public statement before leaving. |
| **Green Mile** (مسیر سبز) | Eliminated player revives one previously eliminated player. |
| **Red Carpet** (فرش قرمز) | Ceremony/display card — eliminated player exits with recognition; specific game effect TBD. |

---

## Intro Day

Everyone awake. Introduction round. No challenge in intro phase.

---

## Intro Night

Wake order: Mafia team → Dr. Lecter → Joker Mafia → Detective → Professional → Doctor.

Roles wake to learn identities. No night actions.

---

## Day (each day)

Flow steps: `day_vote` → `day_elim` (→ end card pick/action when applicable)

Standard day: discussion, vote for defense (more than half), elimination vote (more than half). When player is eliminated, an end card is drawn and the card action page may appear.

---

## Night (each night)

Order: Mafia team → Dr. Lecter → Joker Mafia → Detective → Professional → Doctor

1. **Mafia team** — Godfather picks night shot.
2. **Dr. Lecter** — Saves one mafia member from city night shots (Professional/Sniper).
3. **Joker Mafia** — Optionally flips one Detective query result (max 2 uses per game).
4. **Detective** — Queries one player. Godfather = negative (JokerMafia may flip).
5. **Professional** — Optionally fires one of two shots.
6. **Doctor** — Saves one player.

**At dawn:** Apply mafia shot (doctor save if applicable). Apply Professional shot (Dr. Lecter save if applicable). Apply Joker flip to Detective result.

---

## Win condition

- **Mafia wins** when mafia count ≥ city count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 12 players, 4 mafia.
- `features.lastMove: true`. Elimination cards are drawn on vote-out.
- **Back-navigation:** Reverting night restores deaths. Reverting end card action reverts card effect.

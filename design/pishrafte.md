# Pishrafte (Advanced) — Game Flow Design

**ID:** `pishrafte` · **Name:** Advanced / پیشرفته

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Mafia Boss** (رئیس مافیا) | Leader. Decides night shot. Shows negative to Detective. |
| **Godfather** (پدرخوانده) | Second mafia role (when included). Has sixth sense (once per game guess). Shows as citizen to Detective. |
| **Dr. Lecter** (دکتر لکتر) | Mafia doctor. Saves one mafia member each night from Sniper/Professional shot. Cannot save from city-side kills. |
| **Joker Mafia** (جوکر مافیا) | Wildcard. Once per game, flips a Detective's inquiry result (Detective gets opposite answer for that query). Tracked via `jokerUsed[]` max 2 per game. |
| **NATO** (ناتو) | Once per game, guesses one player's role. If correct → eliminated at dawn. Wakes with Mafia. |
| **Natasha** (ناتاشا) | Wakes before Mafia. Each night selects one player to observe; if that player acts at night (has a night ability that fires), Natasha learns their role. |
| **Swindler** (شیاد) | Each night targets one player. If Detective queries that player, Detective gets opposite result. Can be repeated consecutive nights in some variants. Wakes independently after Mafia. |

### City team

| Role | Description |
|------|-------------|
| **Detective** (کارآگاه) | Queries one player each night. |
| **Doctor** (پزشک) | Saves one player each night. No consecutive same saves. Self-save once per game. |
| **Sniper** (تک‌تیرانداز) | One shot per game. If shoots citizen → Sniper eliminated. If shoots mafia → that player dies. |
| **Professional** (حرفه‌ای) | Two shots per game. Can shoot one player at night. If shoots citizen → Professional eliminated. |
| **Armored** (زره‌پوش) | Has one vest. Survives first mafia shot. Vest destroyed after absorbing. |
| **Invulnerable** (رویین‌تن) | Cannot be killed at night under any circumstances. Can be eliminated by day vote only. |
| **Judge** (قاضی) | Special citizen role (no dedicated night action in current implementation). |
| **Commander** (فرمانده) | Special citizen role (no dedicated night action in current implementation). |
| **Priest** (کشیش) | Special citizen role (no dedicated night action in current implementation). |
| **Researcher** (محقق / هانتر) | Each night links to one player. If Researcher is killed by mafia and linked player is NATO or Swindler → linked player also dies. |
| **Investigator** (بازپرس) | Picks two players each night for investigation. If both survive to morning → next day gets interrogation sub-steps (Bazras-style). Night 1 only in some variants. |
| **Simple Citizen** (شهروند ساده) | No night ability. |

---

## Intro Day

Everyone awake. Introduction round (~50 seconds per player). No challenge in intro day.

---

## Intro Night

Wake order: Researcher → Swindler → Natasha → Mafia team → Dr. Lecter → Joker Mafia → Professional → Doctor → Detective → Sniper.

Roles wake to learn identities. No night actions on intro night.

---

## Day (each day)

Flow steps: `day_vote` → `day_elim`

Standard day: discussion, vote for defense (more than half), elimination vote (more than half).

No mid-day nap.

---

## Night (each night)

Order: Researcher → Swindler → Natasha → Mafia team → Dr. Lecter → Joker Mafia → Professional → Doctor → Detective → Sniper

1. **Researcher** — Links to one player.
2. **Swindler** — Targets one player (flips Detective result for that player).
3. **Natasha** — Observes one player; learns role if they act at night.
4. **Mafia team** — Boss picks shot. NATO uses once-per-game guess if desired.
5. **Dr. Lecter** — Saves one mafia member from city shots.
6. **Joker Mafia** — Once per game (max 2 uses), flips a Detective query result.
7. **Professional** — Uses one of two shots per game.
8. **Doctor** — Saves one player.
9. **Detective** — Queries one player (Swindler flips if targeted).
10. **Sniper** — Once-per-game shot.

**At dawn:** Apply all night effects. Researcher chain kill if applicable. Dr. Lecter save cancels Professional/Sniper against mafia. Doctor save cancels mafia shot. JokerMafia flip applied to Detective result.

---

## Win condition

- **Mafia wins** when mafia count ≥ city count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 15 players, 5 mafia. Largest and most complex scenario.
- No end-cards, no lastMove.
- Many roles overlap with Bazras. Pishrafte is the "kitchen sink" advanced scenario with all roles.
- **Back-navigation:** Reverting night restores all night deaths and role changes.

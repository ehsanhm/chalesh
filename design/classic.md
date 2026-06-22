# Classic

**ID:** `classic` · **Name:** Classic / کلاسیک

---

## Roles

1. **Mafia Boss** (mafia) — Leader; decides the night shot. Shows as citizen (negative) to Detective.
2. **Simple Mafia** (mafia) — No special ability. Coordinate at night; mislead by day.
3. **Detective** (citizen) — Each night checks one player’s side; host signals the result. Mafia Boss always shows as citizen.
4. **Doctor** (citizen) — Saves one player per night from the mafia shot. Cannot save the same person two nights in a row. Can save self only once per game.

---

## Intro Day

Everyone is awake. Short intro (e.g. 50 seconds): introduce themselves, show targets. No role discussion.

---

## Intro Night

Only the mafia team wakes up and learns who is mafia. Then Doctor wakes, then Detective (no actions yet — just wake order for narrator).

---

## Day (each day)

1. **Talk** — Players take turns (e.g. 50 seconds each); discussion and accusations.
2. **Vote for defense** — Vote counts recorded. Players who get **more than half** of eligible votes (eligible = alive − 1) must defend.
3. **Defense and elimination** — Defenders speak. Vote again; the player with **more than half** of eligible votes is eliminated. If no one reaches that, no one is eliminated.

No mid-day nap. Flow steps: `day_vote` → `day_elim`.

---

## Night (each night)

1. **Mafia** — Wake and choose one player to shoot.
2. **Doctor** — Wake and choose one player to save. If save = mafia target, no death.
3. **Detective** — Wake and choose one player to inquire; host gets result (mafia/citizen).

At dawn: resolve. Mafia shot kills the target unless Doctor saved them. No chain kills or special immunities.

---

## Win condition

- **Mafia wins** when mafia count ≥ citizen count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

Default table: 12 players, 4 mafia. No lastMove, no endCards. Back-navigation: reverting a night restores that night’s death and clears resolution for that night.

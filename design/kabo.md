# Kabo (Capo) — Game Flow Design

**ID:** `kabo` · **Name:** Capo / کاپو

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Dan Mafia** (دن مافیا / کاپو) | Leader. Always shows negative to Detective. Decides night shot AND Capo bullet order (which suspect is first in queue next morning). Has antidote: survives one Herbalist poison. If Dan eliminated on Day 1, antidote passes to Witch. |
| **Witch** (جادوگر) | Each night targets one player: that player's own ability activates on themselves (Armorsmith → gets armor; Detective → gets negative inquiry result; Herbalist → poisons self; Citizen → no effect). Wakes with Mafia team. |
| **Executioner** (جلاد) | Mafia team member; no separate night action. Assists Dan Mafia with decisions. |

### City team

| Role | Description |
|------|-------------|
| **Detective** (کارآگاه) | Queries one player each night; gets citizen/mafia result. Dan Mafia always shows negative. Suspect always shows positive. |
| **Heir** (وارث) | Wakes first each night. Links to one player. If the linked player is eliminated and still has an ability charge, Heir inherits that ability (but does not learn the previous link history). |
| **Herbalist** (عطار) | Once per game: poisons one player. Target dies at the start of the next night (cannot be saved by doctor). Dan Mafia has an antidote that counters herbalist poison once. |
| **Armorsmith** (زره‌ساز) | Each night gives armor to one player (can include self). Armored player survives the next mafia shot once. |
| **Suspect** (مظنون) | Citizen; always shows positive to Detective. Can be added to Capo bullet queue after Trust Vote if they receive enough distrust. |
| **Village Chief** (کدخدا) | Civilian; no dedicated night action in current implementation. |
| **Simple Citizen** (شهروند ساده) | No night ability. |

*(Informant/خبرچین removed from Kabo in current implementation.)*

---

## Intro Day

Everyone awake. Short introduction round (players introduce themselves, state mental targets). No challenge in intro day.

---

## Intro Night

Wake order: Heir → Herbalist → Mafia team (Witch/Dan/Executioner) → Detective → Armorsmith → Village Chief.

Intro night: roles wake to learn each other's identities. No actions taken on intro night (Heir does not link, Herbalist does not poison).

---

## Day — special structure

### Day 1

Flow steps: `kabo_trust_vote` → `kabo_suspect_select` → `kabo_midday` → `kabo_shoot`

1. **Trust Vote** (`kabo_trust_vote`) — Every player gets trust votes from others (+ / −). Players who receive enough negative votes become suspects. Results saved to `draft.kaboTrustByDay[day]`.
2. **Suspect Select** (`kabo_suspect_select`) — Moderator confirms suspect list by checking off players. Saved to `draft.kaboSuspectsByDay[day]`.
3. **Mid-day Sleep** (`kabo_midday`) — Everyone sleeps. Mafia team wakes; Dan Mafia picks which of the two gun bullets is real (Gun 1 or Gun 2). Saved to `draft.kaboGunByDay[day]`.
4. **Defense & Shoot** (`kabo_shoot`) — The first suspect in the bullet queue (ordered by Dan's previous-night selection via `fl_capo_bullet_order`) gives a brief defense. Moderator shoots or passes. If shot → player is eliminated immediately. If pass → no elimination that morning.

### Day 2+

Flow steps: `day_vote` → `day_elim`

Standard day discussion, vote for defense, elimination vote.

**Vote thresholds:** More than half of eligible voters for both defense entry and elimination.

---

## Night (each night)

Order: Heir → Herbalist → Mafia team → Detective → Armorsmith → Village Chief

1. **Heir** — Links to one player (ability inheritance).
2. **Herbalist** — Uses once-per-game poison if desired. (Dan's antidote protects Dan once.)
3. **Mafia team** — Dan picks night shot target AND sets Capo bullet order (`fl_capo_bullet_order`) for next morning. Witch targets one player to reflect their ability back.
4. **Detective** — Queries one player. Dan = negative; Suspect = positive.
5. **Armorsmith** — Gives armor to one player.
6. **Village Chief** — No action (display-only step).

**At dawn:** Apply mafia shot (doctor save if doctor is in roster). Apply Herbalist poison (kills at start of night). Apply Witch reflection. Heir inheritance triggers if linked player was eliminated.

---

## Win condition

- **Mafia wins** when mafia count ≥ city count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 10 players, 3 mafia.
- No end-cards, no lastMove.
- `kabo_shoot` applies elimination immediately on change and is reverted on Back (same pattern as `day_elim`).
- Bullet queue ordered by `fl_capo_bullet_order` (set in mafia night section, kabo only). Suspects list from `kaboSuspectsByDay[prevDayKey]`.
- **Back-navigation:** Reverting `kabo_shoot` restores eliminated player. Reverting night restores that night's deaths.

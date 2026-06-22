# Takavar (Commando / TV) — Game Flow Design

**ID:** `takavar` · **Name:** Commando / تکاور · **Also known as:** TV Mafia / مافیا تی‌وی

*Source: [MafiaGP — Scenario TV](https://mafiagp.ir/مافیا-ممنوعه-و-آموزش-کامل-سناریو-تی-وی-tv/)*

---

## Roles

### Mafia team (3 members)

| Role | Persian | Description |
|------|---------|-------------|
| **Don** (Mafia Boss) | دن مافیا / رئیس | Leader; decides the night shot. Always shows as 'citizen' (negative) to Detective. |
| **NATO** | ناتو | Once per game guesses one player's exact role. Correct → that player eliminated. Wrong → silent fail. Using NATO usually replaces the mafia shot that night. |
| **Hostage-Taker** | گروگانگیر | Wakes independently (solo) each night. Blocks one player's night ability. Cannot target the same player on consecutive nights. If Guardian protects the targeted player, the block is nullified. |

### City team (7 members)

| Role | Persian | Description |
|------|---------|-------------|
| **Doctor** | پزشک | Saves players from mafia shot each night. First 3 nights: 2 saves; night 4+: 1 save. Can self-save. No consecutive same-player saves. |
| **Commando** | تکاور | If Mafia kills Commando at night, Commando immediately fires one counter-shot. Hits Mafia → both die. Hits citizen → only Commando dies. Does not trigger if the kill shot was against Don (or if Commando survived). |
| **Detective** | کارآگاه | Queries one player each night. Don always shows negative (citizen). |
| **Gunner** | تفنگدار | Has unlimited blanks + 1 real bullet (knows which is real). Distributes at night. Cannot give real bullet to themselves. Recipients may shoot next day. |
| **Guardian** | نگهبان | Protects players each night: **2 targets** if 8+ alive; **1 target** if 7 or fewer. Protected players cannot be blocked by Hostage-Taker. If Hostage-Taker targets Guardian directly, the block is also nullified. |
| **Simple Citizen** | شهروند ساده | No night ability. |

---

## Vote thresholds

- **Defense entry:** 4+ votes (10–8 players) · 3+ votes (7–6 players) · 2+ votes (5–4 players).
- **Elimination:** Same threshold as defense.
- Multiple defendants can cross-vote; single defendant picks accuser and defender from the table.

---

## Intro Day

Everyone awake. Introduction round. No challenge.

---

## Intro Night

Wake order: Guardian → Hostage-Taker (solo) → Mafia team (Don + NATO) → Detective → Commando → Doctor → Gunner.

Roles wake to confirm identities. No night actions on intro night.

---

## Day (each day)

Flow steps: `day_vote` → `day_elim`

Standard discussion → defense vote → elimination vote. No mid-day nap. No elimination cards.

---

## Night (each night)

| Order | Role | Action |
|-------|------|--------|
| 1 | **Guardian** | Protects 1–2 players from Hostage-Taker block |
| 2 | **Hostage-Taker** (solo) | Blocks one citizen's night ability |
| 3 | **Mafia team** | Don decides: shoot OR NATO guess (NATO replaces shot) |
| 4 | **Detective** | Queries one player (Don = negative) |
| 5 | **Commando** | Counter-shot if Mafia killed Commando this night |
| 6 | **Doctor** | Saves 1–2 players (2 for first 3 nights; 1 after) |
| 7 | **Gunner** | Distributes blank/real bullet to players at night |

**At dawn:** Apply mafia shot (Doctor save cancels). Apply Commando counter-shot if triggered. Apply NATO elimination if correct. Record Gunner distribution for next day use.

---

## Win condition

- **Mafia wins** when mafia count ≥ city count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 10 players, 3 mafia.
- No end-cards (`features.lastMove: false, endCards: false`).
- The scenario name "تکاور" (Commando) refers to the iconic city role that counter-shoots when killed.
- **Hostage-Taker + Guardian interaction:** Guardian's protection nullifies the Hostage-Taker block. If Hostage-Taker targets Guardian directly, block is also nullified.
- **Commando counter-shot:** Only triggers if Mafia shot kills Commando that night. Leave blank if Commando survived.
- **Back-navigation:** Reverting night restores shot deaths and Commando chain kills.

# Zodiac — Game Flow Design

**Scenario ID:** `zodiac`  
**Source:** [tgmafia.com/scenario-zodiac](https://tgmafia.com/scenario-zodiac) (شب‌های مافیا زودیاک)

---

## Day steps (order)

`day_guns` → `day_gun_expiry` → `day_vote` → `day_elim`

- **day_guns:** Guns use + bomb diffusion (when bomb planted). Gunslinger gives 1 gun/night; bomb planted at night, diffused during day. Guard can sacrifice to diffuse during this step.
- **day_gun_expiry:** Unused real guns "burn" and eliminate holder.
- **day_vote** / **day_elim:** Standard vote and elimination.

---

## Roles

| Role | Team | Description |
|------|------|-------------|
| **Al Capone** (آل کاپون) | Mafia | Boss; no vest. Shows negative to Detective. Dies to Professional shot. |
| **Zodiac** (زودیاک) | Independent | Serial killer. Shoots on **even nights only**. Cannot be shot at night; eliminated by gun, vote, or bomb during day. Wins when final 2 remain. |
| **Magician** (شعبده‌باز) | Mafia | Like Matador: disables one player's ability for 24h. Cannot pick same player two nights in a row. |
| **Bomber** (بمب‌گذار) | Mafia | Once per game: plant bomb on one player. Next day: host announces; Guard can diffuse during day (mid-day nap). Target or Guard guesses code 1–4. |
| **Detective** (کارآگاه) | City | Standard inquiry. 2 inquiries per game in Zodiac. |
| **Doctor** (پزشک) | City | Saves one per night. Can save self once per game. |
| **Professional** (حرفه‌ای) | City | 2 shots per game. No vest at night. If shoots Zodiac → no kill. |
| **Guard** (محافظ) | City | Can sacrifice to diffuse bomb; guesses code. If Magician disabled Guard previous night, Guard cannot diffuse that day. |
| **Ocean** (اوشن) | City | Like Mason: 2× per game wakes one citizen. If wakes mafia or Zodiac → Ocean dies next morning. |
| **Gunslinger** (تفنگدار) | City | 1 real + 2 fake guns total. Gives 1 gun/night to others. Cannot give more than one real gun per game. Cannot give to self. Unused guns burn (day_gun_expiry). |

---

## Win conditions

- **Zodiac:** When final 2 players remain (Zodiac + one other).
- **City:** All mafia and Zodiac eliminated.
- **Mafia:** Zodiac eliminated and mafia ≥ city.

**Important:** When counting for game-over (mafia vs city), Zodiac **always** counts as city, regardless of being an independent role. This prevents the game from ending prematurely when mafia and Zodiac outnumber citizens.

---

## Notes

- Zodiac shooting Guard at night → Zodiac dies.
- Status inquiry: 2 per game; voted at day start.
- Detective and Professional must not "گردن بگیرند" (claim) or get kicked.

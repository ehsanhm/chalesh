# Pedarkhande (Godfather)

**ID:** `pedarkhande` · **Name:** Godfather / پدرخوانده

*Source: [Vigiato — آموزش مافیا سناریو پدرخوانده](https://vigiato.net/p/453745)*

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Godfather** (پدرخوانده) | Leader; decides night shot. Has one vest (immune to Leon's shot once). Has sixth sense: once per game can guess a player's role; if correct, that player is eliminated that night at dawn (even Watson cannot save). Godfather's inquiry: Nostradamus = citizen (negative), Citizen Kane = mafia. Each night mafia chooses one: shoot, sixth sense, or Saul buy. |
| **Matador** (ماتادور) | Each night marks one player; that player's night ability is disabled for 24 hours. **Cannot choose the same player two consecutive nights.** Host signals with X if they wake. |
| **Saul Goodman** (ساول گودمن) | Once per game can "buy" one simple citizen and convert them to simple mafia. Only possible if at least one mafia is dead. On the night of the buy, host announces that a purchase will occur. **Only simple citizen can be bought**; if wrong, buy fails and mafia cannot shoot that night. Saul loses the ability permanently. |
| **Simple Mafia** (مافیا ساده) | No night ability; helps Godfather decide the shot. Must deflect suspicion during the day. |

### City team

| Role | Description |
|------|-------------|
| **Dr. Watson** (دکتر واتسون) | Acts as doctor: saves one player per night from mafia shot. Can save self only once per game. Cannot save the same person two nights in a row. |
| **Leon** (لئون حرفه‌ای) | Has 2 bullets. Can shoot one player at night. If he shoots a citizen, Leon is eliminated (Watson cannot save). Has one vest (survives first mafia shot). |
| **Citizen Kane** (همشهری کین) | Once per game marks one player. If mafia: host reveals their role next day (they remain in game); Kane is eliminated the following night (تیر غیب). If wrong: nothing happens; Kane loses the ability. **If marked player dies the same night, Kane's ability is refunded (not wasted)** — he can use it again. |
| **Constantine** (کنستانتین) | Once per game can revive one eliminated player (only if role was not revealed — cannot revive sixth-sense or identity-reveal victims). Previous abilities return but do not refresh. |
| **Simple Citizen** (شهروند ساده) | No night ability. Must help identify mafia during the day. |

### Independent

| Role | Description |
|------|-------------|
| **Nostradamus** (نوستراداموس) | Wakes only on intro night. Picks 3 players; host reveals how many of those 3 are mafia (Godfather does not count as mafia). Nostradamus chooses their side. **Night shot from no side affects Nostradamus**; only eliminated by vote or Godfather's sixth sense. If 2 of 3 are mafia, must join mafia side. |

---

## Intro Day

Everyone is awake. Each player speaks ~40 seconds, introduces themselves, shows targets. **No challenge in intro phase.** No role discussion.

---

## Intro Night

1. **Nostradamus** — Wakes, picks 3 players. Host announces how many of those 3 are mafia (**Godfather does not count as mafia**).
2. **Choose side** — Nostradamus selects Citizens or Mafia. If 2+ of the 3 are mafia, choice is forced to Mafia. Selection is stored as "Nostradamus (citizen)" or "Nostradamus (mafia)" for win condition and winner announcement.
3. **Mafia team** — God wakes them; each shows "Like" hand gesture to confirm they know who is mafia. No actions yet.
4. **Watson, Leon, Kane, Constantine** — God wakes these in order; each shows "Like" to confirm awareness. No actions on intro night.

---

## Day (each day)

1. **Talk** — Players take turns (~50 seconds each); discussion and accusations. Challenge: current speaker can give 30 seconds to a challenger.
2. **Vote for defense** — Players who get **half minus one** (نصف منهای یک) of eligible votes reach defense. Eligible = alive − 1.
3. **Defense and elimination** — Defenders speak. Second vote: player who reaches **half** (نصف) of eligible votes is eliminated. Tie = death lottery (قرعه مرگ).

**Elimination cards:** When a player is eliminated, one **elimination card** is drawn. No will (وصیت). Flow: `day_kane_reveal?` → `day_vote` → `day_elim` → `end_card_action?` (when applicable).

---

## Night (each night)

Order: Mafia team → Watson → Leon → Kane → Constantine.

1. **Mafia team** — Godfather chooses: **shoot**, **sixth sense**, or **Saul buy** (if not yet used). Matador marks one player (cannot repeat previous night). Saul: once per game picks simple citizen to convert.
2. **Dr. Watson** — Choose one player to save.
3. **Leon** — Optionally choose one player to shoot.
4. **Citizen Kane** — Choose one player to mark.
5. **Constantine** — Optionally choose one eliminated player to revive.

**At dawn:** Mafia shot, Leon shot, Saul conversion, Kane reveal (next day), sixth sense (that night) all resolve.

---

## Elimination cards (کارت‌های حرکت آخر)

| Card | Effect |
|------|--------|
| **Beautiful Mind** (ذهن زیبا) | One chance to guess Nostradamus. If correct: guesser returns with own role; Nostradamus eliminated (no role reveal). If Nostradamus draws it: host does status/role inquiry; Nostradamus stays but loses shield and is shot at night. |
| **Identity Reveal** (افشای هویت) | Must announce real role aloud. Constantine cannot revive players who revealed. |
| **Silence of the Lambs** (سکوت بره‌ها) | Can silence 2 players for one day (no defense even if voted). **If drawn in second half** (after half players gone): only 1 player. |
| **Handcuffs** (دستبند) | Pick one player to handcuff; for one day they lose their ability. If Godfather: loses sixth sense that night (mafia keeps shot). |
| **Face Change** (تغییر چهره) | At start of night, secretly swap role with one player; they continue with the new role. |

**Face Change special cases:**
- Nostradamus draws and swaps: host tells new player intro night info and Nostradamus's chosen side.
- Citizen swaps with mafia: that person doesn't wake at night; rest of mafia notice.
- Mafia swaps with citizen/Nostradamus: that player wakes with mafia that night.

---

## Win condition

- **Mafia wins** when mafia count ≥ citizen count (alive).
- **City wins** when all mafia are eliminated.
- **Nostradamus** wins with whichever side they chose.

**Important:** When counting for game-over (mafia vs citizen), Nostradamus **always** counts as citizen, regardless of their chosen side. Their chosen side only affects the winner announcement (who they win with), not whether the game ends.

---

## Notes

- **Default:** 11 players, 3 mafia.
- **No Detective.** Status inquiry only 2 times per game; if most players request, host gives mafia/city/independent count (does not reveal roles).
- **Godfather vest:** Immune to Leon's shot once.
- **Back-navigation:** Reverting a night restores deaths; Status Check reflects state up to current flow position.

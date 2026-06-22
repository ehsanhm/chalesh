# Mozaker (Negotiator) — Game Flow Design

**ID:** `mozaker` · **Name:** Negotiator / مذاکره

*Source: Iranian TV show "Shahrvand va Mafia" — Salamat Network, first scenario.*

---

## Roles

### Mafia team

| Role | Description |
|------|-------------|
| **Mafia Boss** (رئیس مافیا) | Leader. Shows negative to Detective. Decides night shot. Even Sniper cannot kill Mafia Boss (immune to night shots); Boss can only be eliminated by day vote. Negotiation requires Boss approval. |
| **Negotiator** (مذاکره‌کننده) | Once per game can negotiate with one citizen player to join the mafia team, provided at least 1–2 mafia members are already eliminated. Target must be a simple citizen or armored citizen (with armor intact). If a wrong role is chosen, negotiation fails and mafia loses their night shot that night. If negotiation succeeds, that player becomes Simple Mafia and loses their city ability. On the night of negotiation, mafia does NOT shoot anyone. |
| **Simple Mafia** (مافیا ساده) | No night ability. Votes and schemes during the day. |

### City team

| Role | Description |
|------|-------------|
| **Detective** (کارآگاه) | Queries one player's side each night. Mafia Boss always shows negative. |
| **Doctor** (پزشک) | Saves one player each night. Cannot save same person on consecutive nights. Can self-save once per game. In Negotiator scenario, Doctor can save 2 people while player count ≥ 8 (per some rule variants; follow implementation). |
| **Armored** (زره‌پوش) | Has one vest: survives first mafia shot. Vest is destroyed after absorbing one shot. Negotiator can convert Armored to Mafia only if their vest is still intact. |
| **Reporter** (خبرنگار) | After a negotiation night occurs, Reporter can query one person the next night: if that person was the one converted by Negotiator, host confirms it. Reporter's ability is usable every night but is only meaningful after a conversion. |
| **Sniper** (تک‌تیرانداز) | Has bullets equal to half the mafia count (rounded down, min 1). Shoots one player per night. If shoots citizen → Sniper eliminated. If shoots Mafia Boss → no effect (Boss immune). |
| **Simple Citizen** (شهروند ساده) | No night ability. |

---

## Intro Day

Everyone awake. Players introduce themselves, state targets. No role discussion.

---

## Intro Night

Wake order: Mafia team → Doctor → Detective → Negotiator → Reporter.

Roles wake to learn identities. No actions on intro night.

---

## Day (each day)

Flow steps: `day_vote` → `day_elim`

1. **Discussion** — Players accuse and discuss.
2. **Vote for defense** — More than half of eligible votes required for defense entry.
3. **Elimination vote** — More than half of eligible votes required for elimination.

No mid-day nap.

---

## Night (each night)

Order: Mafia team → Doctor → Detective → Negotiator → Reporter

1. **Mafia team** — Boss decides: shoot one player OR negotiate (if eligible: 1–2 mafia eliminated AND negotiation not yet used). On negotiation nights, no shoot occurs.
2. **Doctor** — Saves one player.
3. **Detective** — Queries one player. Boss = negative.
4. **Negotiator** — (only during negotiation decision; otherwise skipped or display-only step).
5. **Reporter** — Queries one player's conversion status.

**At dawn:** Apply mafia shot (or negotiation conversion if negotiation night). Apply doctor save. Record Reporter's query result.

---

## Conditional effects

| Trigger | Effect | When applied |
|---------|--------|--------------|
| Negotiator uses ability, picks wrong role | Negotiation fails; mafia loses shot that night | At dawn |
| Negotiator successfully converts citizen | Citizen becomes Simple Mafia; loses city role | At dawn |
| Reporter queries converted player | Host confirms/denies conversion | At dawn |
| Mafia Boss shot by Sniper | No effect (Boss immune) | At dawn |

---

## Win condition

- **Mafia wins** when mafia count ≥ citizen count (alive).
- **City wins** when all mafia are eliminated.

---

## Notes

- **Default:** 10 players, 3 mafia.
- No end-cards, no lastMove.
- Negotiation: only when 1–2 mafia are already out AND negotiation not yet used. Boss must approve.
- **Back-navigation:** Reverting night restores converted player to original role and restores shot deaths.

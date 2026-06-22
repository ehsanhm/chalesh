# [Scenario name]

**ID:** `________` · **Name:** ________ / ________ (fa)

---

## Roles

1. **[Role name]** (team) — Short description: what they do, any special rule.
2. …

*(List every role that can appear. Keep one line per role.)*

---

## Intro Day

What happens. (e.g. everyone awake, intro round, time limit, no role talk.)

---

## Intro Night

Who wakes and in what order. What they learn or do (if anything). Match `scenarios.js` → `wakeOrder`.

---

## Day (each day)

1. **Phase name** — What happens (talk, vote, etc.).
2. **Phase name** — …
3. …

Vote thresholds: **more than half** or **half** for defense? For elimination? *(Eligible voters = alive − 1.)*

Mid-day nap? If yes, describe the step (e.g. interrogation Cancel/Continue, Capo bullet).

Flow steps: `day_vote` → `day_elim` (or list custom steps if different).

---

## Night (each night)

1. **Who wakes** — What they do (shoot, save, inquire, etc.).
2. …

At dawn: how resolution works (who dies, saves, chain kills, immunities).

---

## Conditional effects and timing *(optional)*

For rules that trigger based on prior actions, document:

| Trigger | Effect | When applied | Flow impact |
|---------|--------|--------------|-------------|
| *e.g. Kane correctly marked Mafia (Night N)* | *e.g. Kane eliminated* | *e.g. At Day N → Night N+1 transition* | *e.g. Kane dead → no action that night* |

**When applied:** Exact flow moment (e.g. “at dawn of Night N”, “when entering Night N+1”, “at end of day vote”).
**Flow impact:** How the effect affects the flow UI (e.g. dead role = step shows as dead, no action; role change = new abilities next night).

---

## Win condition

- **Mafia wins** when …
- **City wins** when …

---

## Notes

Default table size. Any scenario-specific flags (lastMove, endCards). Short back-navigation or edge-case note if needed.

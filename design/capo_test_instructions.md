# Capo (Kabo) Scenario — Test Instructions

Create a Capo test file that uses default player names, starts the game, and runs the Flow.

---

## INTRO DAY

10- Click "Next" on "Intro Day".

---

## INTRO NIGHT

20- In "Intro Night" (single step): **Heir** picks a successor — select the player with Role "Detective". The page also shows the Mafia team list (Mafia Don, Witch, Executioner). Verify mafia names are shown in order. Click "Next".

30- Click "Back" then "Next" — the Heir's successor selection should still be selected.

---

## DAY 1 — Trust Vote

50- Click "Next" to go to "Day 1 • Trust Vote". Each player card has +/- buttons. Give votes to 2–3 players so one has the most votes and becomes "Trusted" (shown at bottom).

60- Click "Back" then "Next" — vote counts and Trusted selection should persist.

70- Click "Next" to go to "Day 1, Step 2 of 4 • Select Suspects".

---

## DAY 1 — Suspect Select

80- The Trusted person picks 2 suspects. The Trusted person's card is disabled (cannot pick self). Select a "citizen" and "executioner" as suspects. Click "Next".

90- Click "Back" then "Next" — the 2 suspects should still be selected.

---

## DAY 1 — Mid-day Sleep

100- Click "Next" to go to "Day 1, Step 3 of 4 • Mid-day Sleep". Capo (Mafia Don) picks which bullet is real: "Gun 1" or "Gun 2". Click the 1st buttons. The selected gun should be highlighted (red border). Click "Next".

110- Click "Back" then "Next" — the real bullet selection should persist.

---

## DAY 1 — Defense & Shoot

120- Click "Next" to go to "Day 1, Step 4 of 4 • Defense & Shoot". The two suspects are shown. Each gun (Gun 1, Gun 2) has a target dropdown. Assign targets: Make sure one of them is shot at the "citizen", the other gun target can be anything. The real bullet (set in Mid-day) kills its target (citizen). If the real gun targets a player, that player is eliminated.

130- Click "Next" and verify the correct player is eliminated (if real bullet had a target). Check Status Check for Day 1.

140- Click "Back" then "Next" — gun target selections should persist. If the real gun had no target (air), no one dies.

---

## NIGHT 1

150- Click "Next" to go to "Night 1, Step 1 of 5 • Heir". Heir confirms or updates successor. Click "Next".

160- Click "Next" to go to "Night 1, Step 2 of 5 • Herbalist". Herbalist should choose player with role "Executioner". Click "Next".

170- Click "Next" to go to "Night 1, Step 3 of 5 • Mafia team". On this page Mafia team can either "shoot", "buy (Yakooza)" or "guess a player's role". Set Mafia's choice to "Guess Role" and select the player with "Detective" role, and choose "detective" in the Guessed Role as well. Click "Next". Make sure we have all options available on this page.

171- click "next", detective should choose a random player

172- click "next", Armorsmith should give armor to himself

173- click "next", if "Village Chief" (Kadkhoda) is in the game, show its page.

174- Click "back" multiple times and make sure all roles can change their selection. Then select the same player that had chosen before.

---

## DAY 2

174- Click "Next" to go to "Day 2, Step 1 of 2 • Voting", open "status check" window and make sure Heir has change his role to Detective. This should be listed in the "Changed Roles" list of Night 1

176- open "flow" window again, At this point we should show a new page called "Day 2, Step 1 of 3 • Poison Status" in which we tell the players, the poison has entered the Game.

180- page "Day 2, Step 2 of 3 • Voting" uses standard voting (no trust vote). Select a player with role "citizen" for defense. Click "Next".

190- Click "Next" to go to "Day 2, Step 3 of 3 • Elimination". Set elimination votes to enough votes to eliminate the player. Click "Next".

---

## NIGHT 2

201- At this point (at the night after the positon entered the game), we should have a new page called "Night 2: Poisoned Player" which is the 1st page shown to moderator for that night, in which we tell all players who was poisoned. We should show the poisioned player name on this page.

202- we then ask players who agrees for the poisoned player to receive the antidote (poison nutralizer). Use cards, do not use spinbox in the UI. As numbers on the cards are changed, update the shown message to moderator if more people agree or more disagree. The moderator then announces if more than half the players agree with giving the antidote or disagree.

203- Then we need a new page "Night 2: Herbalist Decision", in which we wake up the Herbalist and they decide if they want to give the antidote to the poisoned or not. So it's Herbalist's call to decide in the end. Do not use Radio buttons in the UI, use cards always always always. 

206- Then we if antidote was given, moderator announces "Poision was fixed (or something)" and if antidote wasn't given, he announces "Postion worked, PlayerName was posioned and dies"

207- Click "Next" and go to "Night 2,  mafia team shot" page. select player with role "Armorsmith" as Mafia shot.

208- Click "Next" through Night 2 steps. Verify Witch, Executioner, Herbalist, Detective, Armorsmith, Kadkhoda steps appear in correct order.

---

## DAY 3

210- Click "Next" to go to "Day 3, Step 1 of 2 • Voting". Select player with role "herbalist", click "Next".

220- Click "Next" to go to "Day 3, Step 2 of 2 • Elimination". choose enough Elimination votes. Click "Next".

---

## NIGHT 3

230- Click "Next", we should see "Winner" page.

---

## STATUS CHECK

240- Close Flow, open "Status Check". Verify Day 1 shows: kabo_shoot elimination (if real bullet hit someone); Day 2 and Day 3 show correct eliminations.

250- Verify Status Check shows events in correct chronological order (Day 1 → Night 1 → Day 2 → Night 2 → Day 3 → Night 3).

251- **Anyone who dies appears in Eliminated list**: Regardless of how a player dies (mafia shot, executioner guess, vote-out, kabo gun, poison, etc.), they must show up in the "Eliminated" list of the Status Check page for the corresponding day/phase.

252- **All night actions appear in Status Check list**: Every night action (mafia shot, executioner guess-role, yakooza conversion, witch target, etc.) must be shown as an action in the Status Check list, not just the Eliminated list. For example, when the Executioner guesses a player's role correctly, the action "Executioner guessed X is [role] — correct, X eliminated" must appear in the Night 1 actions.

---

## BACK / FORWARD NAVIGATION

260- From Day 3 Voting, click "Back" repeatedly until you reach Day 1 Trust Vote. Verify no errors. Click "Next" forward again — selections should persist where applicable (trust votes, suspects, mid-day gun, kabo shoot targets).

270- From Night 2, click "Back" to Night 1. Change Mafia shot target. Click "Next" forward again — the new shot should apply; previous death should be reverted.

---

## EDGE CASES

280- **Tie in Trust Vote**: If two players have the same max votes, "Trusted" should show "⚠ Tie" and no one is trusted. Suspect select step should show a warning that Trusted must be set first.

290- **No suspects selected**: If Trusted is set but fewer than 2 suspects are selected, Suspect step shows "1/2 suspects selected" (or similar). Cannot proceed until 2 suspects are chosen.

300- **Capo not set real bullet**: If Mid-day step is skipped without selecting Gun 1 or Gun 2, the Defense & Shoot step shows "⚠ Capo has not set the real bullet." Both guns can still be assigned targets, but no one dies from the shoot (real bullet is undefined).

301- **Both guns at air**: Trusted cannot shoot both bullets at air. If both Gun 1 and Gun 2 targets are "Shoot into air", the step shows an inline validation message (no alert). Navigation is never disabled.

302- **Both guns at same person**: Trusted cannot shoot both bullets at the same person. If both guns target the same player, the step shows an inline validation message. The UI change handlers also prevent this by clearing the other gun when they match.

303- **Real bullet kills target**: When the real bullet's gun targets a player, that player is eliminated. The victim must write a will (وصیت) and leave the game; moderator announces the side.

304- **Executioner correct guess is unconditional**: When the Executioner guesses a player's role correctly (Guess Role option), that player dies. No save can prevent this — not armorsmith armor, doctor, Constantine revive, or any other protection.

---

## ROLES REFERENCE (Capo default)

| Role | Team | Description |
|------|------|-------------|
| **Mafia Don** (دن مافیا) | Mafia | Leader; shows negative to Detective. Has one antidote vs Herbalist poison. |
| **Witch** (جادوگر) | Mafia | Picks a citizen; if they have an ability, whatever action they do reflects onto themselves (Detective→inquiry about self; Herbalist→poisons self; Armorsmith→armors self). |
| **Executioner** (جلاد) | Mafia | If correct role guess → target eliminated unconditionally. |
| **Detective** (کارآگاه) | City | Inquiry. |
| **Heir** (وارث) | City | Intro night: pick successor. Immune until successor dies; then inherits ability. |
| **Herbalist** (عطار) | City | Poison each night; antidote vote if poisoned survives day. |
| **Armorsmith** (زره‌ساز) | City | Once per game: save self. |
| **Suspect** (مظنون) | City | Shows positive (mafia) to Detective. |

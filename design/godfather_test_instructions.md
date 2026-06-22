Create a godfather test file, where it uses default player names, starts the game, 

10- runs the Flow

**Citizen Kane rules (must be tested):**
- Kane can use his ability only once during the game.
- Unless his marked player dies the same night — in that case his ability comes back and is not wasted (Kane can use it again next night).


INTRO DAY:
====================================================
20- in "Intro Day" clicks "Next"


INTRO Night:
====================================================
30- in "Intro Night, Step 1 of 3 • 1. Nostradamus", selects 3 players. on this page, we shouldn't show the Nostradamus player card, as he won't choose himself. 

40- Click "Back" then "Next", the selected player cards should be still selected.

50- Click "Next", Choose "Citizens" or "Mafia" team randmoly (unless if 2 guessed players are mafia, then maifa must be the only choice)

60- click "Back" and then "Next" and check if chosen team is still selected.

70- click "Next" and go to "Intro Night Step 3 of 4 • 2. Mafia team", on this page, we should see the mafia team member names in order of importance, first the mafia boss

80- click "Next" and go to "Intro Night Step 4 of 4 • 3. Watson, Leon, Kane, Constantine", the order of roles must be correct on this page.


Day 1:
====================================================
90- click "Next" and go to "Day 1, Step 1 of 2 • Voting" page. In here, we must see all alive player cards, each card must have a challenge button on top right. Choose 2 random challenge buttons, choose player card with "matador" role and a player card with "citizen" role. click "Next", click "Back" again and see if our selections are still there.

100- Click "Next" again and go to "Day 1, Step 2 of 2 • Elimination", set "Elim votes" for the player with "citizen" role to enough vote to elminate. we should see the Vote out: PlayerName get updated to show the correct person.

110- we should see all messages in the same color. "Votes out: PlayerName" should be using one color. PlayerName should not be a different color

120- we should see the "End card for PlayerName: End-Card-Name" get updated. We must show the list of unused end-cards here as well.

130- if player is "handcuffed" we don't need to see 2 status buttons "Alive" and "Handcuffed". Just "Handcuffed" status is enough. 

140- click Next. we should go to "Day 1, Step 3 of 3 . Card Name". Make sure the End-Card-Action page is displayed correctly based on the card-name shown in the page "Day 1, Step 2 of 2 • Elimination". 

150- Test the end-card-action page and make sure we're giving the moderator correct options based on each end-card. Click "Back" twice, this will take us to "Day 1, Step 1 of 2 • Voting", now click "Next" once, this will draw a different end-card, the previous drawn card should become available again, as we went back and drew another card. click "next" and make sure the correct end-card-action page is shown. 

160- repeat this process (clicking "back" 2 time and clicking "next" 2 times) until we have tested all end-card-action pages and see all of them work.

161- When Face Off card is drawn, we should swap the roles of the player who got eliminated by voting with the person they chose in the page "face off end card page". Make sure there's a test for this  too. Also because a role changes, we should also display this info in the "check status" page in the "Changed Roles" list


Night 1:
====================================================
170- Click "Next" to go to "Night 1" page. Close "Flow" and open "Check Status" window.

180- Check "Status Check" info for "Day 1" and see if corrent player is eliminated based on everything we did. 

190- Close "Status Check" and open "Flow" window again. we should be in "Night 1, Step 1 of 5 • Mafia team (Godfather/Matador/Saul)". 

200- Set Godfather Night choice to "Shoot" and select a player with the role "Leon". Leon has one shield and doesn't die the 1st time he was shot by mafia team.

210- Disable player with role "Dr. Watson".

220- Click "Next", close the "Flow", open it again, choose "Back" and we should see the prevoius selections still on the page "Night 1, Step 1 of 5 • Mafia team (Godfather/Matador/Saul)". click "Next"

230- It should say "Dr. Watson" is disabled. click "Next"

240- we should be in page "Night 1 Step 3 of 5 • Leon" and It should say "Leon" has 2 bullets left. It should also say Leon has an used shield. choose Godfather as Leon's shot. It should show a message similar to these: "Leon shot a citizen, Leon dies" or "Leon shot a mafia member, mafia dies" or "Leon shot Godfather, Godfather's shield is used now". Make sure all phases and sub-step messages in the UI are the same color.

250- click "next", we should be in page "Night 1, Step 4 of 5 • Citizen Kane". choose player with role "Matador" as "Citizen Kane"'s mark.

260- click "next", we should be in Night 1, Step 5 of 5 • Constantine". click "next"


Day 2:
====================================================
270- we should be in "day 2, Step 1 of 3 • Citizen Kane's Reveal" page. we should see player with role "Matador" revealed. click "next", close "flow" window and open "check status" window.

280- No one should be dead. Leon and Godfather should be alive because they have one shield each. And "matador"'s role will be revealed to everyone in the game. but they remain in the game. close "status check" window and open "flow" window again. The next day Citize Kane will be in the game, but at night they will be killed by an invisible shot, because they revealed a mafia correctly. 


Day 3:
====================================================
290- Click "next" until we go to "Day 3 Step 1 of 2 • Voting", close "flow" and open "status check", we must see Citizen Kane in the eliminated list. as they die 24 hours after their correct guess by an invisble bullet.

300- Close "status check", open "flow", we should be in page "Day 3 Step 1 of 2 • Voting". select a player with role "matador" and click "Next".

310- select enough elim votes, click "next", show the correct end-card-action page based on drawn card.


Night 3:
====================================================
320- If end-card-action page is shown, click "next" to to go the page "Night 3 Step 1 of 5 • Mafia team (Godfather/Matador/Saul)". choose option "Saul Buy". shown targets for buying should include all alive (non-maifa) players, not just simple "citizens". select a player with a role other than "Citizen", for example "Constantine" or "Dr. Watson" or "Citizen Kane". A message should be displayed saying "Saul buy failed". Change selection to a player with a role "citizen", a message should be displayed saying "Saul buy successful". 

330- Matador shouldn't be able to have an ability as they're dead. if Matador was alive, he should not be able to diable "Dr. Watson" again, as we cannot disable the same player twice in a row.

340- click "next" and click "back" we should be able to to change the "bought" person and it should not say "Saul Buy (unavailable)", bacause we went back in time and this action should get reverted. Now choose another simple citizen to buy. 

350- click "next" to go to page "Night 3 Step 2 of 4 • Dr. Watson". Dr. Watson must be able to save someone. As the 24 hours has passed since he got disabled at "Night 1" by matador. Choose a player with role "Dr. Watson" to save. doctor can save himself only once in the game.

360- click "next" to go to "Night 3, Step 3 of 4 • Leon". Shoot a player from non-mafia team. "Leon" should die as they shot a citizen.

370- click "next" to go to page "Night 3, Step 4 of 4 • Constantine". select player with role "Citizen Kane" (the dead player to revive). click "next". close "flow" window and open "check status" window. Citizen Kane should be alive again.

375- close "flow", open "status check", we must see Eliminated: PlayerName, Revived: PlayerName and Role Switched: PlayerName in the Night 3 logs because at this night Saul Goodman sucessfully bought a citizen.


Day 4:
====================================================
380- click "next" to go to page "Day 4 Step 1 of 2 • Voting", choose a player with role "mafia", click "next", choose enough number of votes to eliminate that Mafia member. 


Night 4:
====================================================
385- click "next" until we get to page "Night 4 Step 1 of 5 • Mafia team (Godfather/Matador/Saul)", choose "sixth sense" for mafia night choice and select user with the role "citizen kane", then in the gussed role, choose "citizen kane" too. 

390- click "next", we should not see the page "Night 4, Step 4 of 5 • Citizen Kane", because when "Citizen Kane" found a mafia member, they lose their ability and die that night by an invisible bullet. The Constantine step must show Constantine's revive UI, not Citizen Kane's content. Constantine's ability is usable only once, even if they are still alive. **When Kane's reveal fails (he marks a non-mafia member), we still show his night step but display "Citizen Kane has already used this ability."**


Day 5:
====================================================
400- open "flow", choose player with Godfather role, click "next", choose enough elimination votes

410- click "next" until we reach "Night 4 Step 1 of 5 • Mafia team (Godfather/Matador/Saul)" page. choose player with role "Nostradamus" as maifa shot. but Nostradamus never dies of night shots as he has unlimited shields.

420- Click "next until we reach "Day 5 Step 1 of 2 • Voting", choose player with role "saul goodman", click "next" and choose enough elimination votes, click "next" until we reach "Night 5, Step 1 of 5 • Mafia team (Godfather/Matador/Saul)". choose a player with role "maifa" as the mafia shot. click "next" until we reach the page "Winner Step 1 of 1 • Winner".







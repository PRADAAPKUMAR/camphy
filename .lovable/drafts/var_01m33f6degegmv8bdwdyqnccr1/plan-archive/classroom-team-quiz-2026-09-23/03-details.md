## Build details

- Add a **Classroom Quiz** tile to the IGCSE and AS grade dashboards and their grade-aware navigation; omit it for A2.
- Add setup and game routes, with invalid/A2 links returning safely to the grade page.
- Create a quiz question selector that reuses available mapped topics, image coverage, private image signing, and protected answer checking.
- Build setup controls for source, multiple topical selections, 2–6 editable teams, 5–40 questions, and a configurable per-question timer.
- Build a large-screen game board with question image, visible countdown, team answer pads, locked states, automatic reveal, score changes, and a live leaderboard.
- Award **1,000 points for a correct answer plus up to 500 speed points**. Wrong or missing answers score zero; ties share the same rank.
- Add the final podium/results board and restart controls.
- Keep all game state local to the teacher’s browser; no accounts, rooms, or database changes.

## Verification

- Confirm the game appears for IGCSE and AS, but not A2.
- Test random and multi-topic selection against real image-backed questions.
- Test all-teams-locked and timer-expired reveals, answer locking, speed scoring, ties, final ranking, restart, and mobile/desktop layouts.

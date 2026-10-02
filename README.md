# Neon Snake

A browser game with Famobi SDK support, gameplay analytics, a local API, Firestore emulator storage, and a dashboard. The project code is in `neon-snake/`; the assessment brief is `task-description.pdf`.

The backend is configured for local evaluation with the Firebase Emulator Suite. No real Firebase project is required.

## How to install and run the project

Requirements: Node.js 22 or later, pnpm, and Java 21 or later for the Firestore emulator.

From the `FAMOBI` folder, install dependencies:

```bash
cd neon-snake && pnpm install
cd server && pnpm install
cd ../dashboard && pnpm install
```

Open four terminals in `FAMOBI`. Run one command in each terminal:

```bash
cd neon-snake/server && pnpm emulators
```

```bash
cd neon-snake/server && pnpm dev
```

```bash
cd neon-snake && pnpm dev
```

```bash
cd neon-snake/dashboard && pnpm dev
```

Open the game at <http://localhost:5173> and the dashboard at <http://localhost:5174>. The Firebase Emulator UI is at <http://127.0.0.1:4000>.

To add sample analytics data, run `cd neon-snake/server && pnpm seed` while the emulator is running.

## How to test the complete flow locally

1. Start the emulator, API, game, and dashboard using the commands above.
2. Open the game. Start a run and steer with the arrow keys or WASD.
3. Pause and resume the game. Complete a level by collecting its required fruit, then try another level. You can also fail by hitting a wall or obstacle and try again.
4. Open the Firebase Emulator UI. Check the `events` collection for raw events and `runs` for one summary per level attempt.
5. Open the dashboard and refresh. Check that the run totals, outcomes, and level data match the runs in Firestore.
6. To try the Famobi integration, check the browser console on localhost; the local Famobi tester logs SDK calls there. Platform-originated commands such as restart and mute require the online Famobi Tester.

Run the automated checks from `FAMOBI`:

```bash
cd neon-snake && pnpm check && pnpm build
cd dashboard && pnpm check && pnpm build
cd ../server && pnpm test
```

The backend test command starts its own emulator. Stop the regular emulator first if it is running.

## Main technical decisions

- One run represents one attempt at one level. This makes level outcomes easy to compare.
- The backend stores both raw events and a summary for each run. Event IDs prevent duplicate records when the game retries sending data.
- The dashboard gets summaries from the API; the browser does not connect directly to Firestore.
- The game uses Famobi storage when available and browser storage otherwise.
- The demo Firebase project ID keeps local work on the emulator instead of a real Firebase project.

## Assumptions and limitations

- A session is one page load; the game does not identify individual players.
- Score carries over between levels, so a run’s score is the current total.
- The analytics queue is in memory. Events may be lost if the browser closes while the API is unavailable.
- The API has no authentication or rate limiting, and statistics are calculated in memory. This setup is for local evaluation, not public use.
- The online Famobi Tester is needed to verify all platform callbacks.

## What I would improve with more time

- Add trusted API access, rate limiting, monitoring, and durable delivery before any public release.
- Store pre-aggregated statistics so the dashboard can handle larger datasets.
- Add more automated game and dashboard flow tests, then verify the remaining Famobi callbacks in the online tester.



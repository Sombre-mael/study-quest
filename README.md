# Study Quest

Study Quest is a study planner you can play. Underneath it is a calm planner:
a deep teal page, a row of day columns and white session cards. On top of it
sits a game layer — every session is worth XP, ticking one off levels you up,
today's quests pay bonuses, badges mark milestones and each test is a boss
whose health bar is made of study minutes.

Everything is stored in the browser (localStorage, key `study-planner:v2`):
there is no account, server database or sync. The look is pixel art — Pixelify
Sans for text, Press Start 2P for headings, square corners, 2px ink frames,
hard offset shadows, a pixel grid and faint scanlines behind the page.

## What it does

- **Plan a test.** "Start your quest" asks for a subject, a date, total study
  time and a session length, then spreads the sessions across the days before
  it (`src/lib/plan.ts`).
- **The week board.** Days scroll sideways on wide screens; cards can be
  added, edited, duplicated, marked done, deleted (with undo) and dragged
  between days. Cards under a test link back to it.
- **Focus timer.** Press play on a card, or "Start focus" in its menu, for a
  full-screen Pomodoro timer (focus blocks with short breaks). When the last
  block ends the card is marked done and the time is logged; leaving early
  keeps the minutes you focused.
- **Daily limit.** Days over the limit (default 2h) get a warm ring, an "over"
  pill and **Rebalance**, which moves their last sessions to the nearest days
  with room, never past a session's test. Set it in More → Daily limit & timer.
- **Exam readiness.** Every test card and the progress page compare study on
  that subject in the three weeks before the test against the test's target;
  a light fill shows what is still planned.
- **Quest log** (`/quests`, the level strap in the header): level, rank, XP to
  the next level, the four quests of the day, badges, bosses and the warm-up
  game. XP comes from the same study record the planner writes, so nothing is
  stored twice: one XP per minute studied plus 15 per session ticked off, plus
  today's cleared quests and warm-up bonuses. Levels follow a fixed curve and
  the streak multiplies what today is worth (×1.25 from 3 days, ×1.5 from 7,
  ×2 from 14) — all in `src/lib/game.ts`.
- **Warm-up game.** A 30-second memory match with your subjects that pays up
  to 50 bonus XP, for three paid rounds a day (`WARM_UP_DAILY_LIMIT`); after
  that the board still plays but earns nothing until tomorrow.
- **Progress** (`/stats`): time studied per subject, streak, sessions done,
  next test and the last 14 days against the daily limit.
- **Subjects** (`/subjects`): add, rename, recolour and re-icon subjects.
- **Week and month views** (`/week`, `/month`): the week shows Monday to
  Sunday with drag and drop, the month every day at a glance and opens a day
  on the board.
- **Print a week** (`/print?d=YYYY-MM-DD`): a white one-page sheet sized to
  screenshot cleanly and to print landscape.
- **Onboarding.** An empty planner (More → Start fresh) shows a welcome panel
  instead of the board. Set `seedForNewUsers` to `false` in `src/data.ts` to
  open new visitors on it instead of the sample plan.
- **Style guide** (`/styleguide`, linked from the More menu and page footers):
  every token and component, rendered live.

## On a phone

Below 768px the app has its own layout rather than a shrunken board:

- a fixed bottom tab bar (Planner, Quests, Progress, Subjects) with safe-area
  padding, and a lighter header that keeps only the logo, level and More;
- the planner becomes **one day at a time**: a swipeable date strip with a dot
  per session and a flag for tests, then that day's cards full width, its total
  and its Add session / Rebalance actions (`src/app/MobileBoard.tsx`);
- the week stacks its seven days as compact blocks, the month keeps the seven
  columns with dots instead of card names;
- dialogs rise as bottom sheets with their footer clear of the home indicator.

## Run it

Requires Node 20+ and pnpm. There is no Bun step.

```sh
pnpm install       # installs from pnpm-lock.yaml
pnpm run dev       # Vite + the Worker in workerd, on http://localhost:5182
pnpm run build     # dist/client (assets) + dist/study_planner/index.js (Worker)
pnpm run typecheck # tsc --noEmit
```

`pnpm-workspace.yaml` approves the build scripts of `esbuild` and `workerd`;
pnpm 11 refuses to run an install that leaves them unapproved.

## How it is built

React 19 with Vite 8, Tailwind CSS v4 (`@theme` tokens in `src/styles.css`),
Motion for animation, and a small Cloudflare Worker that serves the app.

- `src/app/` — the screens: `Board` (wide), `MobileBoard` (phones),
  `MobileTabBar`, `DayColumn`, `SessionCard`, `WeekView`, `MonthView`,
  `Hero`, `FocusTimer`, `QuestsPage`, `MemoryGame`, `GameHud`, `StatsPage`,
  `SubjectsPage`, `PrintWeek`, `Onboarding`, `StyleGuide`, and the dialogs
  (`PlanDialog`, `ItemDialog`, `SubjectDialog`, `SettingsDialog`).
- `src/components/` — the design system: `Button`, `IconButton`, `Panel`,
  `Dialog`, `Menu`, `Field` / `Segmented` / pickers, `Pill`, `SubjectChip`,
  `ReadinessMeter`, `ProgressRing`, `Charts`, `StatTile`, `Toast`, `Logo`.
  See them all at `/styleguide`.
- `src/lib/store.ts` — the reducer and localStorage persistence (a `v1` save
  is migrated). Swap its load/save for API calls to keep plans in a database.
- `src/lib/game.ts` — XP, levels, ranks, streak boost, daily quests, badges,
  bosses and the warm-up cap/reward. `src/lib/insights.ts` holds day load,
  rebalance, readiness, streak and per-subject time; `src/lib/focus.ts` splits
  a session into Pomodoro blocks; `src/lib/plan.ts` spreads sessions.
- `src/lib/router.tsx` — a tiny History-API router (`useRoute`, `navigate`,
  `Link`); the Worker serves `index.html` for any app path.
- `src/data.ts` — every string, the default subjects, colours and icons, the
  daily-limit and timer options, the sample plan and sample study history.
- `src/worker/index.ts` — `GET /api/health`, a JSON 404 for other `/api`
  paths, and the app for everything else.

Motion respects the system "reduce motion" setting.

## Deploy with Freebuff Sites

`deploy.json` points at the build output. Run `pnpm run build`, then deploy
this directory with the `sites_deploy` tool (or the Sites API).

# Study Quest

A study planner you can play. Underneath it is the same calm planner: a deep
teal page, a horizontally scrolling row of day columns and white session
cards. On top of it sits a game layer — every session is worth XP, ticking one
off levels you up, today's quests pay bonuses, badges mark milestones and each
test is a boss whose health bar is made of study minutes. "Start your quest"
asks for a test (subject, date, total study time, session length) and spreads
study sessions across the days before it. Cards can be added, edited,
duplicated, marked done, deleted (with undo) and dragged between days.
Everything is saved in the browser, so there is no account or database.

The game numbers all come from the same study record the planner writes, so
nothing is stored twice: XP is one per minute studied plus 15 per session
ticked off (plus today's cleared quests and warm-up bonuses), levels follow a
fixed curve in `src/lib/game.ts`, and the streak multiplies what today is
worth (×1.25 from 3 days, ×1.5 from 7, ×2 from 14).

Beyond the board:

- **Quest log** (`/quests`, the level strap in the header): level, rank, XP to
  the next level, the four quests of the day, badges, bosses (tests with a
  health bar) and the warm-up game — a memory match with your subjects that
  pays up to 50 bonus XP, for three paid rounds a day (`WARM_UP_DAILY_LIMIT`
  in `src/lib/game.ts`); after that it is practice only until tomorrow.
  Opened from the header, a session's menu or the page itself.

- **Week and month views** (`/week`, `/month`), switched from the header
  (under the hero on phones). Week shows Monday to Sunday with drag and drop;
  month shows every day at a glance and opens a day on the board.
- **Focus timer** (`/focus/<card id>`): press play on a card, or "Start focus"
  in its menu, for a full-screen Pomodoro timer (focus blocks with short
  breaks). When the last block ends the card is marked done and the time is
  logged. Leaving early keeps the minutes you focused.
- **Daily limit**: days over the limit (default 2h) get a warm ring, an
  "over" pill and a **Rebalance** button that moves their last sessions to the
  nearest days with room, never past a session's test. Set it in More → Daily
  limit & timer.
- **Exam readiness** on every test card and on the progress page: study on the
  test's subject in the three weeks before it, against the test's target. The
  light fill shows what is still planned.
- **Progress** (`/stats`): time studied per subject, streak, sessions done,
  next test, and the last 14 days against the daily limit.
- **Subjects** (`/subjects`): add, rename, recolour and re-icon subjects.
- **Print a week** (`/print?d=YYYY-MM-DD`): a white one-page sheet sized to
  screenshot cleanly and to print landscape.
- **Onboarding**: an empty planner (More → Start fresh) shows a welcome panel
  instead of the board. Set `seedForNewUsers` to `false` in `src/data.ts` to
  open new visitors on it instead of the sample plan.
- **Style guide** (`/styleguide`, linked from the More menu and page footers):
  every token and component, rendered live.

## Run it

This project is set up for pnpm (no Bun needed).

```sh
pnpm install       # writes pnpm-lock.yaml from package.json
pnpm run dev       # http://localhost:5182 (Vite + the Worker in workerd)
pnpm run build     # dist/client (assets) + dist/study_planner/index.js (Worker)
pnpm run typecheck # tsc --noEmit
```

## Edit it

- `src/data.ts` holds every string, the default subjects, the subject colour
  and icon choices, the daily-limit and timer options, the sample plan and the
  sample study history. Start there.
- `src/lib/store.ts` is the reducer and the localStorage persistence (key
  `study-planner:v2`; round-one `v1` saves are migrated). Swap its load/save
  for API calls to keep plans in a database.
- `src/lib/plan.ts` spreads sessions before a test. `src/lib/insights.ts`
  holds the numbers: day load, rebalance, readiness, streak, per-subject time.
  `src/lib/game.ts` turns those numbers into XP, levels, ranks, quests, badges
  and bosses; `src/app/MemoryGame.tsx` is the warm-up mini-game and
  `src/app/QuestsPage.tsx` the quest log. `src/lib/focus.ts` splits a session
  into Pomodoro blocks.
- `src/lib/router.tsx` is a tiny History-API router (`useRoute`, `navigate`,
  `Link`). The Worker serves `index.html` for any app path.
- `src/app/` holds the screens: `Hero`, `Board`, `WeekView`, `MonthView`,
  `DayColumn`, `SessionCard`, `FocusTimer`, `StatsPage`, `SubjectsPage`,
  `PrintWeek`, `Onboarding`, `StyleGuide`, and the dialogs (`PlanDialog`,
  `ItemDialog`, `SubjectDialog`, `SettingsDialog`).
- `src/components/` is the design system: `Button` (pill, primary, secondary,
  ghost, danger, glass, link, linkDark; xs–lg; loading), `IconButton`,
  `SubjectChip`, `Pill` / `DurationPill` / `TestPill` / `OverPill`,
  `DateBadge`, `Menu`, `Dialog`, `Field` / `FieldGroup` / `Input` /
  `Segmented` / `SubjectPicker` / `ColorPicker` / `IconPicker`, `Panel`,
  `PageHeader`, `StatTile`, `ProgressRing`, `ReadinessMeter`, `BarChart` /
  `DayBars`, `EmptyState`, `Toast` and `Logo`. See them all at `/styleguide`.
- `src/styles.css` holds the tokens: teal page colours, column and card
  surfaces, lavender and flag pills, radii (`chip`, `card`, `column`,
  `dialog`), shadows, motion durations and easings, and keyframes. Springs are
  in `src/app/motion.ts`. Board geometry (column width, gap, edge fades) is a
  set of CSS variables at the top of `src/app/App.tsx`.
- The look is pixel art: 'Pixelify Sans' for text, 'Press Start 2P' for
  headings, square corners, 2px ink frames and hard offset shadows, a pixel
  grid and faint scanlines behind the page. The hero mascot is
  `public/pixel-scholar.png` (drawn from scratch, no photos).
- Motion respects the system "reduce motion" setting.
- `src/worker/index.ts` is the Cloudflare Worker: `GET /api/health`, a JSON
  404 for any other `/api` path, and the app for everything else.

## Deploy with Freebuff Sites

`deploy.json` already points at the build output. After `bun run build`, deploy
it with the `sites_deploy` tool (or the Sites API) from this directory.

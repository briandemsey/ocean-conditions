# Plan: Build Session Tracking Module (Strava Engine MVP)

**Status:** Planned
**Last Updated:** February 7, 2026

## Context

The Ocean Conditions app is live at actionsports.world with 6 screens for surf conditions. The broader vision (see [STRATEGY.md](STRATEGY.md)) is "Surfline meets Strava" — conditions intelligence + activity tracking. We're now building the **first Strava module**: session logging and stats for surfers. This gives users a reason to come back daily, not just when checking forecasts.

**No user auth for MVP** — all sessions stored in a shared SQLite database. Auth comes later.

**Important caveat:** Render's free tier has an ephemeral filesystem — the SQLite DB resets on each deploy. This is fine for development/demo. For production persistence, we'll need Render's paid tier with a persistent disk (or migrate to Postgres later).

## New Screens (3)

1. **Log Session** (`/sessions/log` or `/sessions/log/:spotId`) — Form to record a surf session
2. **Session History** (`/sessions`) — Feed of past sessions with filtering
3. **Session Stats** (`/sessions/stats`) — Dashboard with totals, trends, and top spots

## Files Summary

| Action | File | Purpose |
|--------|------|---------|
| INSTALL | `better-sqlite3` | SQLite driver for Node.js |
| MODIFY | `.gitignore` | Exclude `*.db` files |
| CREATE | `server/db.js` | SQLite init, schema, prepared statements |
| MODIFY | `server/index.js` | Import db, add 5 session API routes |
| CREATE | `src/components/SessionCard.jsx` | Session display card component |
| CREATE | `src/pages/LogSession.jsx` | Log session form |
| CREATE | `src/pages/SessionHistory.jsx` | Session feed |
| CREATE | `src/pages/SessionStats.jsx` | Stats dashboard |
| MODIFY | `src/App.jsx` | Add routes + "Sessions" nav link |
| MODIFY | `src/pages/SpotOverview.jsx` | Add "Log Session" button |

## Steps

### 1. Install dependency + update .gitignore

- `npm install better-sqlite3`
- Add `server/data/*.db`, `server/data/*.db-wal`, `server/data/*.db-shm` to `.gitignore`

### 2. Create `server/db.js` — SQLite setup

Schema:
```sql
CREATE TABLE IF NOT EXISTS sessions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  spot_id TEXT NOT NULL,
  spot_name TEXT NOT NULL,
  date TEXT NOT NULL,
  start_time TEXT,
  duration INTEGER NOT NULL,
  wave_count INTEGER,
  board TEXT,
  notes TEXT,
  rating INTEGER,
  conditions TEXT,
  created_at TEXT DEFAULT (datetime('now'))
);
```

Export prepared statements: `insertSession`, `getAllSessions`, `getSessionsBySpot`, `getSessionById`, `deleteSessionById`.

### 3. Add 5 API routes to `server/index.js`

All placed BEFORE the catch-all `/{*path}` route. Order matters — `/api/sessions/stats` must come before `/api/sessions/:id`.

| Route | Method | Purpose |
|-------|--------|---------|
| `/api/sessions/stats` | GET | Aggregated stats (totals, top spot, weekly trend) |
| `/api/sessions` | GET | List sessions (optional `?spotId=` filter) |
| `/api/sessions/:id` | GET | Single session |
| `/api/sessions` | POST | Create session (validates required fields) |
| `/api/sessions/:id` | DELETE | Delete session |

### 4. Create `src/components/SessionCard.jsx`

Displays one session in the feed. Same styling as ConditionCard (`bg-[#112240] border border-[#1e3a5f] rounded-lg`). Shows: spot name (linked), date, duration, wave count, board, conditions badges, notes, rating pip, delete button.

### 5. Create `src/pages/LogSession.jsx`

Form fields:
- **Spot** — dropdown from `src/data/spots.js`, pre-filled when navigated from `/sessions/log/:spotId`
- **Date** — date input, defaults to today
- **Start Time** — time input, optional
- **Duration** — number input (minutes), quick-select buttons (30/60/90/120)
- **Wave Count** — number input, optional
- **Board** — text input, optional (e.g., "6'2 shortboard")
- **Rating** — clickable 1-6 circles colored by rating level (reuses `getRatingByLevel`)
- **Notes** — textarea, optional

Auto-fetches conditions from `/api/conditions/:spotId` when spot is selected and displays a read-only snapshot. Conditions object gets saved with the session.

POSTs to `/api/sessions`, redirects to `/sessions` on success.

### 6. Create `src/pages/SessionHistory.jsx`

- Fetches from `GET /api/sessions` (or `?spotId=` when filtered)
- Spot filter dropdown
- "Log Session" button linking to `/sessions/log`
- Link to `/sessions/stats` for stats dashboard
- Maps sessions to `<SessionCard>` components
- Delete handler with confirmation
- Empty state with CTA

### 7. Create `src/pages/SessionStats.jsx`

Stat cards using `ConditionCard` component:
- Total Sessions, Total Waves, Avg Duration, Total Time, Avg Rating, Top Spot, Top Board

Recharts `BarChart` for sessions-per-week trend (last 12 weeks). Same chart styling as `ForecastDetail.jsx` (dark grid, tooltips, axis colors).

### 8. Modify `src/App.jsx`

- Import 3 new pages
- Add "Sessions" link in nav bar (alongside "Search Spots")
- Add 4 routes: `/sessions`, `/sessions/log`, `/sessions/log/:spotId`, `/sessions/stats`

### 9. Modify `src/pages/SpotOverview.jsx`

Add "Log Session" `<Link>` button to the bottom navigation row (same styling as "Multi-Source Comparison" and "Nearby Spots" buttons).

### 10. Build, test, commit, push

- `npm run build` to verify frontend compiles
- `npm start` and test the full flow locally
- Commit and push — Render auto-deploys

## Verification

1. `npm install` succeeds (better-sqlite3 compiles)
2. `npm start` — server starts, creates `sessions.db`
3. `curl -X POST /api/sessions` with test data → 201 response
4. `curl /api/sessions` → returns the created session
5. `curl /api/sessions/stats` → returns aggregated stats
6. Open `http://localhost:3001/sessions` — empty state shows
7. Fill out Log Session form → session appears in history
8. Stats page shows correct totals and chart
9. "Log Session" from SpotOverview pre-fills the spot
10. `npm run build` succeeds
11. `git push` → Render deploys successfully

## Future Enhancements (Post-MVP)

- User authentication (accounts, personal sessions)
- Social features (kudos, comments, feed of friends' sessions)
- GPS session tracking (paddle-out routes)
- Boards equipment manager
- Personal records and achievements
- Session challenges (weekly goals, streaks)
- Training calendar view
- Photo uploads per session

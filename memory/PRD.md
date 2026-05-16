# EarnPlay — PRD

## Vision
A gamified mobile app where users earn XP & coins by playing mini-games, claiming daily rewards, chatting globally, and climbing the leaderboard.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54) + Expo Router + TypeScript
- **Backend**: FastAPI + Motor (MongoDB) + JWT/bcrypt
- **Storage**: Mongo (users, quiz_questions, xp_events, chat_messages, mission_progress); SecureStore for JWT

## Implemented Features

### Authentication
- Email/password register, login, forgot-password (mock), logout
- JWT (7-day) with bcrypt-hashed passwords, SecureStore-persisted

### Home Dashboard
- Avatar, username, coin balance pill
- Level + XP card with progress bar to next level
- Stats: streak, games played
- Daily-reward CTA
- 4-card quick-action grid (Quiz / Spin / Tap / Missions)
- Pull-to-refresh

### Daily Reward
- One claim per UTC day; streak bonus (+5 coins per streak day)
- Celebration result card

### Mini Games
- **Quiz Showdown**: 5 random questions from a 10-question seed pool. Correct: +15 XP +10 coins · Wrong: +5 XP
- **Spin Wheel**: 8 server-randomised prizes (5–100 coins / XP). 1-min rate limit. Animated 5-revolution spin
- **Tap Challenge**: 15-second sprint; +1 XP per 5 taps, +1 coin per 10 taps; tracks personal best (anti-cheat clamp)

### Daily Missions (NEW Phase 2)
- 4 daily missions auto-tracked: Quiz Warrior (3 quiz answers), Lucky Spinner (2 spins), Loyal Player (claim daily), Speed Demon (100 taps)
- Progress auto-increments when related action endpoints fire
- Manual claim awards bonus XP+coins; resets daily (UTC)

### Global Chat (NEW Phase 2)
- Single global room, last 50 messages
- 4-second polling refresh
- Self vs other styled bubbles, optimistic append on send
- 2 seed welcome messages from demo users

### Leaderboard
- Top-50 entries with podium for top-3 (trophy asset)
- **All-Time** uses total user XP
- **Weekly / Monthly** (NEW Phase 2): real aggregation from `xp_events` collection (7 / 30-day windows). Every XP award is logged
- Highlighted "(YOU)" row for current user

### Profile
- Avatar, username (editable), email, join date
- 4-stat bento grid (XP / Level / Coins / Streak)
- Best Tap Score field
- Badges chips
- Edit profile + logout

## Design System (v3 — premium redesign)
- Refined palette: violet → pink → cyan gradients, dark-first with auto light mode
- Soft layered shadows (`softShadow` helper) replace prior hard offsets; gradient hero cards on key surfaces
- Animated component primitives: `BrutalButton` (spring press feedback), `BrutalCard` (optional press scale), `GradientCard`, animated `Progress`, `Skeleton`, `AnimatedEntrance` wrapper
- 350ms staggered fade + slide-up entrance on every screen
- Skeleton loaders on Chat & Leaderboard
- Frosted-glass floating bottom **5-tab** bar (BlurView on iOS) — Home / Games / Chat / Leaderboard / Profile
- Ionicons + custom 3D coin/wheel/trophy/tap assets
- All previous testIDs preserved through the refactor

## API Surface (`/api/*`)
**Auth**
- `POST /auth/register` `POST /auth/login` `POST /auth/logout` `POST /auth/forgot-password`
- `GET /auth/me` · `PATCH /profile`

**Rewards & Games**
- `POST /rewards/daily-claim`
- `GET /games/quiz/questions` · `POST /games/quiz/submit`
- `POST /games/spin`
- `POST /games/tap/submit` *(new)*

**Missions** *(new)*
- `GET /missions` · `POST /missions/{key}/claim`

**Chat** *(new)*
- `GET /chat/messages?limit=N` · `POST /chat/messages`

**Leaderboard**
- `GET /leaderboard?period=weekly|monthly|all` (weekly/monthly now use real `xp_events` windows)

## Testing
- 40/40 cumulative backend pytest cases pass (21 Phase 1 + 19 Phase 2)
- All critical frontend flows validated by testing agent on 390x844 viewport

## Roadmap (v3 — not yet)
- Private DMs + online/offline status + push notifications
- Admin panel (user/reward/mission management, bans)
- Refresh tokens, real email-backed password reset
- "Watch ad for extra spin / 2x reward" monetisation hook

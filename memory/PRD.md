# EarnPlay — PRD

## Vision
A gamified mobile app where users earn XP & coins by playing mini-games, claiming daily rewards, and climbing the leaderboard.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54) + Expo Router + TypeScript
- **Backend**: FastAPI + Motor (MongoDB) + JWT/bcrypt
- **Storage**: Mongo (users, quiz_questions); SecureStore for JWT on device

## Implemented Features (MVP v1)
### Authentication
- Email/password register, login, forgot-password (mock), logout
- JWT (7-day) with bcrypt-hashed passwords
- Persistent session via SecureStore

### Home Dashboard
- Avatar, username, coin balance pill
- Level + XP card with progress bar to next level
- Stats: streak, games played
- Daily reward CTA + 4-card quick-action grid
- Pull-to-refresh

### Daily Reward
- One claim per day, server-validated
- Streak tracking (+5 bonus coins per streak day)
- Animated celebration card

### Quiz Game
- 5 random questions per session from a 10-question seed pool
- Correct: +15 XP, +10 coins · Incorrect: +5 XP
- Inline correct/wrong feedback, end-of-quiz summary

### Spin Wheel
- 8 prize slots, server-randomised
- Animated 5-revolution spin with prize reveal
- Coin/XP rewards 5–100

### Leaderboard
- Top-50 users by XP
- Tabs: Weekly / Monthly / All-Time
- Podium for top-3 with trophy asset
- Highlighted "(YOU)" row

### Profile
- Avatar, username (editable), email, join date
- 4-stat bento grid (XP, level, coins, streak)
- Badges chips
- Edit profile, logout

## Design System
- Neo-brutalist + vibrant pastels (per design guidelines)
- Hard 4px offset shadows, 2px borders, rounded-xl/2xl/pill
- Dark/light mode auto-follows system
- Bottom floating pill tab bar (Home / Games / Leaderboard / Profile)
- Ionicons throughout; custom 3D coin/wheel/trophy assets

## API Surface (`/api/*`)
- `POST /auth/register`, `POST /auth/login`, `POST /auth/logout`, `POST /auth/forgot-password`
- `GET /auth/me`, `PATCH /profile`
- `POST /rewards/daily-claim`
- `GET /games/quiz/questions`, `POST /games/quiz/submit`
- `POST /games/spin`
- `GET /leaderboard?period=weekly|monthly|all`

## Roadmap (v2 — not in MVP)
- Tap Challenge (timed tap game)
- Global Chat + private DMs (websockets)
- Tasks/Missions (invite friends, watch ad, activity)
- Admin panel (user/reward/mission management, bans)
- Refresh tokens, real password-reset email, push notifications

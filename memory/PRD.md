# EarnPlay — PRD

## Vision
A gamified mobile app where users earn XP & coins by playing mini-games, claiming daily rewards, chatting globally, watching rewarded ads, and climbing the leaderboard. With admin controls for moderation.

## Tech Stack
- **Frontend**: React Native (Expo SDK 54) + Expo Router + TypeScript
- **Backend**: FastAPI + Motor (MongoDB) + JWT/bcrypt 4.0.1
- **Storage**: MongoDB (users, quiz_questions, xp_events, chat_messages, mission_progress); SecureStore for JWT

## Implemented Features (v4)

### Authentication
- Email/password register, login, forgot-password (mock), logout
- JWT (7-day), bcrypt-hashed passwords, SecureStore-persisted
- **Banned users blocked at login (403)**

### Home Dashboard
- Time-aware greeting, avatar, coin balance pill
- Gradient hero level card with XP progress bar
- Streak + games-played stat cards
- Daily-reward CTA
- **Watch-ad bonus CTA (gradient orange)**
- 4-tile gradient quick-action grid (Quiz / Spin / Tap / Missions)
- Pull-to-refresh

### Mini Games
- Quiz (5 questions, +15/+10 on correct)
- Spin Wheel (8 prizes, 1-min cooldown, animated 5-rev spin)
- Tap Challenge (15s sprint, anti-cheat clamp, personal-best tracking)

### Daily Reward
- One claim per UTC day, streak bonus (+5 coins/day)

### Daily Missions
- 4 missions auto-tracked; manual claim awards bonus; UTC reset

### Global Chat
- REST-polled 4s refresh, self/other bubbles, optimistic send, seeded welcome messages

### Leaderboard
- Top-50 with gradient podium; real **Weekly / Monthly windows** via `xp_events` aggregation; All-Time uses total XP

### Profile
- Gradient header with avatar ring
- 6-stat bento grid (XP / Level / Coins / Streak / Games / Best Tap)
- Badges, edit username, **Admin panel link** (admins only), logout

### Rewarded-Ad Monetisation (MOCKED ad SDK)
- `POST /api/rewards/watch-ad` → +40 XP, +50 coins, 1-hour cooldown
- `RewardedAdModal` plays a 5-second simulated ad with animated progress, success/error phases

### Admin Panel (admins only)
- `/admin` screen lists all users with avatars, level, XP, coins, admin/banned flags
- `+100` quick grant (XP + coins) via `POST /api/admin/grant`
- Ban/Unban with confirmation alert via `POST /api/admin/ban` (cannot ban an admin)

## Design System (v3 premium, retained)
- Soft layered shadows, violet→pink→cyan gradient palette
- Animated component primitives: spring-press button, scale-press cards, animated Progress, Skeleton loaders, AnimatedEntrance wrapper (350ms staggered)
- Frosted-glass floating 5-tab bar (Home / Games / Chat / Leaderboard / Profile)
- Dark/light auto-follow system

## API Surface (`/api/*`)
**Auth**: register · login · logout · forgot-password · me · profile
**Rewards**: daily-claim · watch-ad
**Games**: quiz/questions · quiz/submit · spin · tap/submit
**Missions**: GET /missions · POST /missions/{key}/claim
**Chat**: messages GET/POST
**Leaderboard**: ?period=weekly|monthly|all
**Admin**: /admin/users · /admin/grant · /admin/ban

## Testing
- **61/61 cumulative backend pytest pass** (40 from iter1+2 + 21 from iter4)
- All frontend testIDs verified end-to-end across 4 iterations

## Roadmap (v5)
- Push notifications (expo-notifications, real device only)
- Private DMs + online/offline presence
- Refresh tokens + real email-backed password reset
- Real ad-network integration (replace MOCKED watch-ad)

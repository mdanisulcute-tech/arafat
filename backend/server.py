from fastapi import FastAPI, APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
import uuid
import random
import secrets
from pathlib import Path
from pydantic import BaseModel, EmailStr, Field
from typing import List, Optional, Literal
from datetime import datetime, timezone, timedelta
from passlib.context import CryptContext
import jwt

# ------------------------------------------------------------
# Config
# ------------------------------------------------------------
ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / ".env")

MONGO_URL = os.environ["MONGO_URL"]
DB_NAME = os.environ["DB_NAME"]
JWT_SECRET = os.environ.get("JWT_SECRET") or "earnplay_secret_change_in_prod_" + secrets.token_hex(8)
JWT_ALGO = "HS256"
JWT_EXP_MIN = 60 * 24 * 7  # 7 days

pwd_ctx = CryptContext(schemes=["bcrypt"], deprecated="auto")
security = HTTPBearer(auto_error=False)

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]

app = FastAPI(title="EarnPlay API")
api_router = APIRouter(prefix="/api")


def now_utc() -> datetime:
    return datetime.now(timezone.utc)


def ensure_aware(dt: Optional[datetime]) -> Optional[datetime]:
    if dt is None:
        return None
    if dt.tzinfo is None:
        return dt.replace(tzinfo=timezone.utc)
    return dt


def level_from_xp(xp: int) -> int:
    return max(1, xp // 100 + 1)


# ------------------------------------------------------------
# Models
# ------------------------------------------------------------
class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(min_length=2, max_length=24)
    password: str = Field(min_length=6, max_length=64)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordRequest(BaseModel):
    email: EmailStr


class UserPublic(BaseModel):
    id: str
    email: EmailStr
    username: str
    avatar: str
    xp: int
    coins: int
    level: int
    streak: int
    best_tap_score: int = 0
    last_login_reward_at: Optional[datetime] = None
    badges: List[str] = []
    games_played: int = 0
    created_at: datetime


class AuthResponse(BaseModel):
    token: str
    user: UserPublic


class ProfileUpdate(BaseModel):
    username: Optional[str] = Field(default=None, min_length=2, max_length=24)
    avatar: Optional[str] = None


class QuizQuestion(BaseModel):
    id: str
    question: str
    options: List[str]


class QuizSubmit(BaseModel):
    question_id: str
    answer_index: int


class SpinResult(BaseModel):
    prize_index: int
    prize_label: str
    coins_awarded: int
    xp_awarded: int


class TapSubmit(BaseModel):
    taps: int = Field(ge=0, le=1000)
    duration_ms: int = Field(ge=1000, le=60000)


class LeaderboardEntry(BaseModel):
    rank: int
    username: str
    avatar: str
    xp: int
    level: int


class ChatMessage(BaseModel):
    id: str
    user_id: str
    username: str
    avatar: str
    text: str
    created_at: datetime


class ChatSend(BaseModel):
    text: str = Field(min_length=1, max_length=300)


class Mission(BaseModel):
    id: str
    key: str
    title: str
    description: str
    goal: int
    xp_reward: int
    coin_reward: int
    progress: int
    claimed: bool


# ------------------------------------------------------------
# Auth helpers
# ------------------------------------------------------------
def hash_password(pw: str) -> str:
    return pwd_ctx.hash(pw)


def verify_password(pw: str, hashed: str) -> bool:
    try:
        return pwd_ctx.verify(pw, hashed)
    except Exception:
        return False


def create_jwt(user_id: str) -> str:
    payload = {
        "sub": user_id,
        "exp": now_utc() + timedelta(minutes=JWT_EXP_MIN),
        "iat": now_utc(),
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGO)


def decode_jwt(token: str) -> Optional[str]:
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGO])
        return payload.get("sub")
    except Exception:
        return None


async def get_current_user(
    creds: Optional[HTTPAuthorizationCredentials] = Depends(security),
) -> dict:
    if not creds or not creds.credentials:
        raise HTTPException(status_code=401, detail="Missing token")
    uid = decode_jwt(creds.credentials)
    if not uid:
        raise HTTPException(status_code=401, detail="Invalid token")
    user = await db.users.find_one({"id": uid}, {"_id": 0})
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
    return user


def user_to_public(u: dict) -> UserPublic:
    return UserPublic(
        id=u["id"],
        email=u["email"],
        username=u["username"],
        avatar=u.get("avatar", ""),
        xp=u.get("xp", 0),
        coins=u.get("coins", 0),
        level=level_from_xp(u.get("xp", 0)),
        streak=u.get("streak", 0),
        best_tap_score=u.get("best_tap_score", 0),
        last_login_reward_at=u.get("last_login_reward_at"),
        badges=u.get("badges", []),
        games_played=u.get("games_played", 0),
        created_at=u["created_at"],
    )


AVATARS = [
    "https://images.unsplash.com/flagged/photo-1596479042555-9265a7fa7983?crop=entropy&cs=srgb&fm=jpg&w=200&q=70",
    "https://images.unsplash.com/photo-1612203304476-2ed23c55b5b9?crop=entropy&cs=srgb&fm=jpg&w=200&q=70",
    "https://images.unsplash.com/photo-1662850886700-4ec19bd30d11?crop=entropy&cs=srgb&fm=jpg&w=200&q=70",
]


# ------------------------------------------------------------
# Helpers: award_xp + mission progress
# ------------------------------------------------------------
async def log_xp_event(user_id: str, xp: int):
    if xp <= 0:
        return
    await db.xp_events.insert_one({
        "id": str(uuid.uuid4()),
        "user_id": user_id,
        "xp": xp,
        "created_at": now_utc(),
    })


MISSION_TEMPLATES = [
    {"key": "play_quiz_3", "title": "Quiz Warrior", "description": "Answer 3 quiz questions", "goal": 3, "xp": 50, "coins": 20},
    {"key": "spin_2", "title": "Lucky Spinner", "description": "Spin the wheel 2 times", "goal": 2, "xp": 30, "coins": 15},
    {"key": "daily_claim", "title": "Loyal Player", "description": "Claim today's daily reward", "goal": 1, "xp": 10, "coins": 5},
    {"key": "tap_100", "title": "Speed Demon", "description": "Score 100 taps in Tap Challenge", "goal": 100, "xp": 40, "coins": 25},
]


def today_key() -> str:
    return now_utc().strftime("%Y-%m-%d")


async def bump_mission(user_id: str, key: str, amount: int = 1, set_value: Optional[int] = None):
    today = today_key()
    doc = await db.mission_progress.find_one({"user_id": user_id, "key": key, "date": today})
    if not doc:
        await db.mission_progress.insert_one({
            "user_id": user_id,
            "key": key,
            "date": today,
            "progress": set_value if set_value is not None else amount,
            "claimed": False,
        })
        return
    update = {}
    if set_value is not None:
        if set_value > doc.get("progress", 0):
            update["progress"] = set_value
    else:
        update["progress"] = doc.get("progress", 0) + amount
    if update:
        await db.mission_progress.update_one(
            {"user_id": user_id, "key": key, "date": today},
            {"$set": update},
        )


# ------------------------------------------------------------
# Routes — Auth
# ------------------------------------------------------------
@api_router.post("/auth/register", response_model=AuthResponse)
async def register(body: RegisterRequest):
    existing = await db.users.find_one({"email": body.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    existing_un = await db.users.find_one({"username": body.username})
    if existing_un:
        raise HTTPException(status_code=400, detail="Username taken")

    uid = str(uuid.uuid4())
    user_doc = {
        "id": uid,
        "email": body.email.lower(),
        "username": body.username,
        "avatar": random.choice(AVATARS),
        "password_hash": hash_password(body.password),
        "xp": 0,
        "coins": 50,
        "streak": 0,
        "best_tap_score": 0,
        "last_login_reward_at": None,
        "badges": ["newcomer"],
        "games_played": 0,
        "created_at": now_utc(),
    }
    await db.users.insert_one(user_doc)
    token = create_jwt(uid)
    user_doc.pop("password_hash", None)
    return AuthResponse(token=token, user=user_to_public(user_doc))


@api_router.post("/auth/login", response_model=AuthResponse)
async def login(body: LoginRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    if not user or not verify_password(body.password, user.get("password_hash", "")):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    token = create_jwt(user["id"])
    return AuthResponse(token=token, user=user_to_public(user))


@api_router.post("/auth/forgot-password")
async def forgot_password(body: ForgotPasswordRequest):
    user = await db.users.find_one({"email": body.email.lower()})
    return {
        "message": "If that email exists, a reset link has been sent.",
        "demo_reset_token": "demo-reset-token" if user else None,
    }


@api_router.post("/auth/logout")
async def logout(current=Depends(get_current_user)):
    return {"message": "Logged out. Discard your token on the client."}


@api_router.get("/auth/me", response_model=UserPublic)
async def me(current=Depends(get_current_user)):
    return user_to_public(current)


@api_router.patch("/profile", response_model=UserPublic)
async def update_profile(body: ProfileUpdate, current=Depends(get_current_user)):
    updates = {}
    if body.username and body.username != current["username"]:
        clash = await db.users.find_one({"username": body.username, "id": {"$ne": current["id"]}})
        if clash:
            raise HTTPException(status_code=400, detail="Username taken")
        updates["username"] = body.username
    if body.avatar:
        updates["avatar"] = body.avatar
    if updates:
        await db.users.update_one({"id": current["id"]}, {"$set": updates})
        current.update(updates)
    return user_to_public(current)


# ------------------------------------------------------------
# Routes — Rewards
# ------------------------------------------------------------
@api_router.post("/rewards/daily-claim")
async def daily_claim(current=Depends(get_current_user)):
    last = ensure_aware(current.get("last_login_reward_at"))
    today = now_utc().date()
    if last is not None:
        last_date = last.date()
        if last_date == today:
            raise HTTPException(status_code=400, detail="Already claimed today")
        yesterday = today - timedelta(days=1)
        new_streak = current.get("streak", 0) + 1 if last_date == yesterday else 1
    else:
        new_streak = 1

    coins_reward = 20 + (new_streak * 5)
    xp_reward = 25
    await db.users.update_one(
        {"id": current["id"]},
        {
            "$set": {"last_login_reward_at": now_utc(), "streak": new_streak},
            "$inc": {"coins": coins_reward, "xp": xp_reward},
        },
    )
    await log_xp_event(current["id"], xp_reward)
    await bump_mission(current["id"], "daily_claim", set_value=1)

    updated = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return {
        "coins_awarded": coins_reward,
        "xp_awarded": xp_reward,
        "streak": new_streak,
        "user": user_to_public(updated).model_dump(mode="json"),
    }


# ------------------------------------------------------------
# Routes — Quiz
# ------------------------------------------------------------
@api_router.get("/games/quiz/questions", response_model=List[QuizQuestion])
async def quiz_questions(current=Depends(get_current_user)):
    items = await db.quiz_questions.find({}, {"_id": 0, "correct_index": 0}).to_list(20)
    random.shuffle(items)
    return [QuizQuestion(**q) for q in items[:5]]


@api_router.post("/games/quiz/submit")
async def quiz_submit(body: QuizSubmit, current=Depends(get_current_user)):
    q = await db.quiz_questions.find_one({"id": body.question_id}, {"_id": 0})
    if not q:
        raise HTTPException(status_code=404, detail="Question not found")
    correct = body.answer_index == q["correct_index"]
    xp_award = 15 if correct else 5
    coins_award = 10 if correct else 0
    await db.users.update_one(
        {"id": current["id"]},
        {"$inc": {"xp": xp_award, "coins": coins_award, "games_played": 1}},
    )
    await log_xp_event(current["id"], xp_award)
    await bump_mission(current["id"], "play_quiz_3", amount=1)

    updated = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return {
        "correct": correct,
        "correct_index": q["correct_index"],
        "xp_awarded": xp_award,
        "coins_awarded": coins_award,
        "user": user_to_public(updated).model_dump(mode="json"),
    }


# ------------------------------------------------------------
# Routes — Spin
# ------------------------------------------------------------
SPIN_PRIZES = [
    {"label": "+10 Coins", "coins": 10, "xp": 5},
    {"label": "+50 XP", "coins": 0, "xp": 50},
    {"label": "+25 Coins", "coins": 25, "xp": 0},
    {"label": "JACKPOT 100", "coins": 100, "xp": 30},
    {"label": "+5 Coins", "coins": 5, "xp": 5},
    {"label": "+20 XP", "coins": 0, "xp": 20},
    {"label": "+15 Coins", "coins": 15, "xp": 10},
    {"label": "+40 XP", "coins": 0, "xp": 40},
]


@api_router.post("/games/spin", response_model=SpinResult)
async def spin_wheel(current=Depends(get_current_user)):
    last_spin = ensure_aware(current.get("last_spin_at"))
    if isinstance(last_spin, datetime):
        if now_utc() - last_spin < timedelta(minutes=1):
            raise HTTPException(status_code=429, detail="Slow down! Try again in a minute.")

    idx = random.randint(0, len(SPIN_PRIZES) - 1)
    prize = SPIN_PRIZES[idx]
    await db.users.update_one(
        {"id": current["id"]},
        {
            "$set": {"last_spin_at": now_utc()},
            "$inc": {"coins": prize["coins"], "xp": prize["xp"], "games_played": 1},
        },
    )
    await log_xp_event(current["id"], prize["xp"])
    await bump_mission(current["id"], "spin_2", amount=1)

    return SpinResult(
        prize_index=idx,
        prize_label=prize["label"],
        coins_awarded=prize["coins"],
        xp_awarded=prize["xp"],
    )


# ------------------------------------------------------------
# Routes — Tap Challenge
# ------------------------------------------------------------
@api_router.post("/games/tap/submit")
async def tap_submit(body: TapSubmit, current=Depends(get_current_user)):
    # Anti-cheat sanity: max ~12 taps per second
    max_reasonable = int(body.duration_ms / 1000 * 12) + 5
    taps = min(body.taps, max_reasonable)

    # XP = floor(taps / 5), coins = floor(taps / 10)
    xp_award = taps // 5
    coins_award = taps // 10

    best = current.get("best_tap_score", 0)
    is_new_best = taps > best
    update = {"$inc": {"xp": xp_award, "coins": coins_award, "games_played": 1}}
    if is_new_best:
        update["$set"] = {"best_tap_score": taps}

    await db.users.update_one({"id": current["id"]}, update)
    await log_xp_event(current["id"], xp_award)
    await bump_mission(current["id"], "tap_100", set_value=taps)

    updated = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return {
        "taps": taps,
        "xp_awarded": xp_award,
        "coins_awarded": coins_award,
        "is_new_best": is_new_best,
        "best_tap_score": max(best, taps),
        "user": user_to_public(updated).model_dump(mode="json"),
    }


# ------------------------------------------------------------
# Routes — Missions
# ------------------------------------------------------------
@api_router.get("/missions", response_model=List[Mission])
async def missions_list(current=Depends(get_current_user)):
    today = today_key()
    progress_docs = await db.mission_progress.find(
        {"user_id": current["id"], "date": today}, {"_id": 0}
    ).to_list(100)
    by_key = {p["key"]: p for p in progress_docs}

    result: List[Mission] = []
    for t in MISSION_TEMPLATES:
        p = by_key.get(t["key"], {})
        result.append(
            Mission(
                id=f"{today}-{t['key']}",
                key=t["key"],
                title=t["title"],
                description=t["description"],
                goal=t["goal"],
                xp_reward=t["xp"],
                coin_reward=t["coins"],
                progress=min(p.get("progress", 0), t["goal"]),
                claimed=p.get("claimed", False),
            )
        )
    return result


@api_router.post("/missions/{mission_key}/claim")
async def claim_mission(mission_key: str, current=Depends(get_current_user)):
    template = next((t for t in MISSION_TEMPLATES if t["key"] == mission_key), None)
    if not template:
        raise HTTPException(status_code=404, detail="Mission not found")

    today = today_key()
    doc = await db.mission_progress.find_one({
        "user_id": current["id"], "key": mission_key, "date": today
    })
    progress = doc.get("progress", 0) if doc else 0
    claimed = doc.get("claimed", False) if doc else False

    if claimed:
        raise HTTPException(status_code=400, detail="Already claimed")
    if progress < template["goal"]:
        raise HTTPException(status_code=400, detail="Mission not complete yet")

    xp = template["xp"]
    coins = template["coins"]
    await db.users.update_one(
        {"id": current["id"]},
        {"$inc": {"xp": xp, "coins": coins}},
    )
    await log_xp_event(current["id"], xp)
    await db.mission_progress.update_one(
        {"user_id": current["id"], "key": mission_key, "date": today},
        {"$set": {"claimed": True}},
        upsert=True,
    )

    updated = await db.users.find_one({"id": current["id"]}, {"_id": 0})
    return {
        "xp_awarded": xp,
        "coins_awarded": coins,
        "user": user_to_public(updated).model_dump(mode="json"),
    }


# ------------------------------------------------------------
# Routes — Chat
# ------------------------------------------------------------
@api_router.get("/chat/messages", response_model=List[ChatMessage])
async def list_chat(current=Depends(get_current_user), limit: int = 50):
    limit = max(1, min(limit, 100))
    cursor = db.chat_messages.find({}, {"_id": 0}).sort("created_at", -1).limit(limit)
    items = await cursor.to_list(limit)
    items.reverse()
    return [ChatMessage(**m) for m in items]


@api_router.post("/chat/messages", response_model=ChatMessage)
async def send_chat(body: ChatSend, current=Depends(get_current_user)):
    msg = {
        "id": str(uuid.uuid4()),
        "user_id": current["id"],
        "username": current["username"],
        "avatar": current.get("avatar", ""),
        "text": body.text.strip(),
        "created_at": now_utc(),
    }
    await db.chat_messages.insert_one(msg.copy())
    return ChatMessage(**msg)


# ------------------------------------------------------------
# Routes — Leaderboard (real windows)
# ------------------------------------------------------------
@api_router.get("/leaderboard", response_model=List[LeaderboardEntry])
async def leaderboard(period: Literal["weekly", "monthly", "all"] = "all"):
    if period == "all":
        cursor = db.users.find({}, {"_id": 0, "id": 1, "username": 1, "avatar": 1, "xp": 1}).sort("xp", -1).limit(50)
        items = await cursor.to_list(50)
        result: List[LeaderboardEntry] = []
        for i, u in enumerate(items):
            result.append(
                LeaderboardEntry(
                    rank=i + 1,
                    username=u.get("username", "anon"),
                    avatar=u.get("avatar", ""),
                    xp=u.get("xp", 0),
                    level=level_from_xp(u.get("xp", 0)),
                )
            )
        return result

    # weekly / monthly: aggregate xp_events
    days = 7 if period == "weekly" else 30
    since = now_utc() - timedelta(days=days)
    pipeline = [
        {"$match": {"created_at": {"$gte": since}}},
        {"$group": {"_id": "$user_id", "xp": {"$sum": "$xp"}}},
        {"$sort": {"xp": -1}},
        {"$limit": 50},
    ]
    agg = await db.xp_events.aggregate(pipeline).to_list(50)
    if not agg:
        return []

    user_ids = [a["_id"] for a in agg]
    user_docs = await db.users.find({"id": {"$in": user_ids}}, {"_id": 0}).to_list(len(user_ids))
    by_id = {u["id"]: u for u in user_docs}

    result: List[LeaderboardEntry] = []
    rank = 1
    for a in agg:
        u = by_id.get(a["_id"])
        if not u:
            continue
        total_xp = u.get("xp", 0)
        result.append(
            LeaderboardEntry(
                rank=rank,
                username=u.get("username", "anon"),
                avatar=u.get("avatar", ""),
                xp=a["xp"],  # window XP
                level=level_from_xp(total_xp),
            )
        )
        rank += 1
    return result


# ------------------------------------------------------------
# Health
# ------------------------------------------------------------
@api_router.get("/")
async def root():
    return {"message": "EarnPlay API running", "time": now_utc().isoformat()}


# ------------------------------------------------------------
# Startup: seed
# ------------------------------------------------------------
QUIZ_SEED = [
    {"question": "Which planet is known as the Red Planet?", "options": ["Venus", "Mars", "Jupiter", "Saturn"], "correct_index": 1},
    {"question": "What is 9 × 7?", "options": ["56", "63", "72", "81"], "correct_index": 1},
    {"question": "Who wrote 'Romeo and Juliet'?", "options": ["Dickens", "Shakespeare", "Hemingway", "Austen"], "correct_index": 1},
    {"question": "Largest ocean on Earth?", "options": ["Atlantic", "Indian", "Arctic", "Pacific"], "correct_index": 3},
    {"question": "Which language runs in a web browser?", "options": ["Python", "Java", "JavaScript", "C++"], "correct_index": 2},
    {"question": "Capital of Japan?", "options": ["Seoul", "Beijing", "Tokyo", "Bangkok"], "correct_index": 2},
    {"question": "Chemical symbol for gold?", "options": ["Go", "Gd", "Au", "Ag"], "correct_index": 2},
    {"question": "How many continents are there?", "options": ["5", "6", "7", "8"], "correct_index": 2},
    {"question": "Author of '1984'?", "options": ["Orwell", "Huxley", "Tolkien", "Bradbury"], "correct_index": 0},
    {"question": "Speed of light (approx, km/s)?", "options": ["3,000", "30,000", "300,000", "3,000,000"], "correct_index": 2},
]

DEMO_USERS = [
    {"email": "demo@earnplay.app", "username": "DemoHero", "password": "Demo1234!", "xp": 850, "coins": 420},
    {"email": "ace@earnplay.app", "username": "AceMaster", "password": "Demo1234!", "xp": 1240, "coins": 680},
    {"email": "luna@earnplay.app", "username": "LunaStar", "password": "Demo1234!", "xp": 540, "coins": 210},
]


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.users.create_index("username", unique=True)
    await db.quiz_questions.create_index("id", unique=True)
    await db.chat_messages.create_index("created_at")
    await db.xp_events.create_index([("user_id", 1), ("created_at", -1)])
    await db.mission_progress.create_index(
        [("user_id", 1), ("key", 1), ("date", 1)], unique=True
    )

    if await db.quiz_questions.count_documents({}) == 0:
        docs = [{"id": str(uuid.uuid4()), **q} for q in QUIZ_SEED]
        await db.quiz_questions.insert_many(docs)
        logger.info("Seeded %d quiz questions", len(docs))

    for i, du in enumerate(DEMO_USERS):
        exists = await db.users.find_one({"email": du["email"]})
        if exists:
            continue
        await db.users.insert_one({
            "id": str(uuid.uuid4()),
            "email": du["email"],
            "username": du["username"],
            "avatar": AVATARS[i % len(AVATARS)],
            "password_hash": hash_password(du["password"]),
            "xp": du["xp"],
            "coins": du["coins"],
            "streak": 0,
            "best_tap_score": 0,
            "last_login_reward_at": None,
            "badges": ["pioneer"],
            "games_played": 0,
            "created_at": now_utc(),
        })

    # Seed a couple of welcome chat messages so the chat feels alive
    if await db.chat_messages.count_documents({}) == 0:
        ace = await db.users.find_one({"username": "AceMaster"})
        luna = await db.users.find_one({"username": "LunaStar"})
        seeds = []
        if ace:
            seeds.append({
                "id": str(uuid.uuid4()),
                "user_id": ace["id"],
                "username": ace["username"],
                "avatar": ace["avatar"],
                "text": "GLHF everyone! 🔥",
                "created_at": now_utc() - timedelta(minutes=5),
            })
        if luna:
            seeds.append({
                "id": str(uuid.uuid4()),
                "user_id": luna["id"],
                "username": luna["username"],
                "avatar": luna["avatar"],
                "text": "Just hit Level 10 on the spin wheel ✨",
                "created_at": now_utc() - timedelta(minutes=2),
            })
        if seeds:
            await db.chat_messages.insert_many(seeds)

    logger.info("Demo users + seed data ready")


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

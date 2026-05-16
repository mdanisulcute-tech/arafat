"""EarnPlay backend integration tests via public preview URL."""
import os
import time
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL missing"
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@earnplay.app"
DEMO_PASSWORD = "Demo1234!"


@pytest.fixture(scope="session")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="session")
def demo_token(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    return r.json()["token"]


@pytest.fixture(scope="session")
def new_user(session):
    # fresh user for state-changing tests
    suffix = uuid.uuid4().hex[:8]
    payload = {
        "email": f"test_{suffix}@earnplay.app",
        "username": f"TEST_{suffix}",
        "password": "Pass1234!",
    }
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"], "payload": payload}


# ---------- Health ----------
def test_root(session):
    r = session.get(f"{API}/")
    assert r.status_code == 200
    assert "message" in r.json()


# ---------- Auth ----------
class TestAuth:
    def test_register_returns_token_and_user(self, new_user):
        assert new_user["token"]
        u = new_user["user"]
        assert u["email"] == new_user["payload"]["email"]
        assert u["username"] == new_user["payload"]["username"]
        assert u["coins"] >= 50
        assert u["level"] >= 1

    def test_register_duplicate_email(self, session, new_user):
        r = session.post(f"{API}/auth/register", json={
            "email": new_user["payload"]["email"],
            "username": "Other_" + uuid.uuid4().hex[:6],
            "password": "Pass1234!",
        })
        assert r.status_code == 400
        assert "email" in r.json()["detail"].lower()

    def test_register_duplicate_username(self, session, new_user):
        r = session.post(f"{API}/auth/register", json={
            "email": f"other_{uuid.uuid4().hex[:6]}@earnplay.app",
            "username": new_user["payload"]["username"],
            "password": "Pass1234!",
        })
        assert r.status_code == 400
        assert "username" in r.json()["detail"].lower()

    def test_login_demo(self, session, demo_token):
        assert demo_token

    def test_login_wrong_password(self, session):
        r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "WRONG"})
        assert r.status_code == 401

    def test_me_with_token(self, session, demo_token):
        r = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {demo_token}"})
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL

    def test_me_without_token(self, session):
        r = session.get(f"{API}/auth/me")
        assert r.status_code == 401

    def test_me_invalid_token(self, session):
        r = session.get(f"{API}/auth/me", headers={"Authorization": "Bearer not.a.jwt"})
        assert r.status_code == 401

    def test_forgot_password(self, session):
        r = session.post(f"{API}/auth/forgot-password", json={"email": DEMO_EMAIL})
        assert r.status_code == 200
        assert "message" in r.json()

    def test_logout_authenticated(self, session, demo_token):
        r = session.post(f"{API}/auth/logout", headers={"Authorization": f"Bearer {demo_token}"})
        assert r.status_code == 200


# ---------- Profile ----------
class TestProfile:
    def test_update_username(self, session, new_user):
        new_name = f"TESTu_{uuid.uuid4().hex[:6]}"
        r = session.patch(
            f"{API}/profile",
            json={"username": new_name},
            headers={"Authorization": f"Bearer {new_user['token']}"},
        )
        assert r.status_code == 200, r.text
        assert r.json()["username"] == new_name
        # verify persistence
        me = session.get(f"{API}/auth/me", headers={"Authorization": f"Bearer {new_user['token']}"})
        assert me.json()["username"] == new_name

    def test_update_username_duplicate(self, session, new_user):
        # Use demo's username
        r = session.patch(
            f"{API}/profile",
            json={"username": "DemoHero"},
            headers={"Authorization": f"Bearer {new_user['token']}"},
        )
        assert r.status_code == 400


# ---------- Rewards ----------
class TestRewards:
    def test_daily_claim_first_then_duplicate(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r1 = session.post(f"{API}/rewards/daily-claim", headers=h)
        assert r1.status_code == 200, r1.text
        body = r1.json()
        assert body["coins_awarded"] > 0
        assert body["xp_awarded"] > 0
        assert body["streak"] == 1

        r2 = session.post(f"{API}/rewards/daily-claim", headers=h)
        assert r2.status_code == 400


# ---------- Quiz ----------
class TestQuiz:
    def test_quiz_questions_no_correct_index(self, session, demo_token):
        h = {"Authorization": f"Bearer {demo_token}"}
        r = session.get(f"{API}/games/quiz/questions", headers=h)
        assert r.status_code == 200
        qs = r.json()
        assert len(qs) == 5
        for q in qs:
            assert "correct_index" not in q
            assert len(q["options"]) >= 2
            assert q["question"]

    def test_quiz_submit_correct_vs_wrong(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        # baseline XP
        me0 = session.get(f"{API}/auth/me", headers=h).json()
        xp0 = me0["xp"]

        qs = session.get(f"{API}/games/quiz/questions", headers=h).json()
        first_q = qs[0]
        # try answer 0 — capture correct flag
        r = session.post(
            f"{API}/games/quiz/submit",
            json={"question_id": first_q["id"], "answer_index": 0},
            headers=h,
        )
        assert r.status_code == 200, r.text
        a = r.json()
        assert "correct" in a
        assert a["user"]["xp"] > xp0  # XP always increases (5 wrong, 15 correct)

        # Submit a known wrong index — pick something != correct
        correct_idx = a["correct_index"]
        wrong_idx = (correct_idx + 1) % len(first_q["options"])
        # need a different question (same id would still work)
        q2 = qs[1]
        r2 = session.post(
            f"{API}/games/quiz/submit",
            json={"question_id": q2["id"], "answer_index": wrong_idx},
            headers=h,
        )
        assert r2.status_code == 200

    def test_quiz_submit_invalid_question(self, session, demo_token):
        h = {"Authorization": f"Bearer {demo_token}"}
        r = session.post(
            f"{API}/games/quiz/submit",
            json={"question_id": "not-a-real-id", "answer_index": 0},
            headers=h,
        )
        assert r.status_code == 404


# ---------- Spin ----------
class TestSpin:
    def test_spin_then_rate_limited(self, session, new_user):
        h = {"Authorization": f"Bearer {new_user['token']}"}
        r1 = session.post(f"{API}/games/spin", headers=h)
        assert r1.status_code == 200, r1.text
        body = r1.json()
        assert "prize_index" in body
        assert "prize_label" in body
        assert body["coins_awarded"] >= 0
        assert body["xp_awarded"] >= 0

        time.sleep(0.5)
        r2 = session.post(f"{API}/games/spin", headers=h)
        assert r2.status_code == 429


# ---------- Leaderboard ----------
class TestLeaderboard:
    @pytest.mark.parametrize("period", ["all", "weekly", "monthly"])
    def test_leaderboard(self, session, period):
        r = session.get(f"{API}/leaderboard", params={"period": period})
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 1
        # sorted by xp desc
        xps = [i["xp"] for i in items]
        assert xps == sorted(xps, reverse=True)
        # ranks sequential starting at 1
        assert items[0]["rank"] == 1

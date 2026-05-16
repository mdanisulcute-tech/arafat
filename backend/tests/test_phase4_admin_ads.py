"""Iteration 4 backend tests — Rewarded Ad endpoint + Admin role/endpoints + Ban-on-login.

These tests are additive to backend_test.py and test_phase2.py. They reuse the seeded
admin (admin@earnplay.app) and demo (demo@earnplay.app) accounts but create fresh
throwaway users for state-changing operations (ban, grant) so the seed remains usable.
"""
import os
import uuid
import pytest
import requests
from dotenv import load_dotenv

load_dotenv("/app/frontend/.env")
BASE_URL = os.environ.get("EXPO_PUBLIC_BACKEND_URL", "").rstrip("/")
assert BASE_URL, "EXPO_PUBLIC_BACKEND_URL missing"
API = f"{BASE_URL}/api"

ADMIN_EMAIL = "admin@earnplay.app"
ADMIN_PASSWORD = "Admin1234!"
DEMO_EMAIL = "demo@earnplay.app"
DEMO_PASSWORD = "Demo1234!"


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


@pytest.fixture(scope="module")
def admin_auth(session):
    r = session.post(f"{API}/auth/login", json={"email": ADMIN_EMAIL, "password": ADMIN_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


@pytest.fixture(scope="module")
def demo_auth(session):
    r = session.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD})
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


def _register(session) -> dict:
    sfx = uuid.uuid4().hex[:8]
    payload = {
        "email": f"test_p4_{sfx}@earnplay.app",
        "username": f"TESTp4_{sfx}",
        "password": "Pass1234!",
    }
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    return {
        "token": data["token"],
        "user": data["user"],
        "payload": payload,
        "headers": {"Authorization": f"Bearer {data['token']}"},
    }


# ---------------- Admin role & login ----------------
class TestAdminLogin:
    def test_admin_login_returns_is_admin_true(self, admin_auth):
        u = admin_auth["user"]
        assert u["email"] == ADMIN_EMAIL
        assert u.get("is_admin") is True
        assert u.get("is_banned") is False

    def test_demo_login_is_not_admin(self, demo_auth):
        assert demo_auth["user"].get("is_admin") is False


# ---------------- Admin: list users ----------------
class TestAdminUsers:
    def test_admin_can_list_users(self, session, admin_auth):
        r = session.get(f"{API}/admin/users", headers=admin_auth["headers"])
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) >= 4  # at least 4 seed users
        emails = [i["email"] for i in items]
        assert ADMIN_EMAIL in emails
        assert DEMO_EMAIL in emails
        for u in items:
            assert "id" in u
            assert "is_admin" in u
            assert "is_banned" in u
            assert "_id" not in u  # mongo _id must be excluded

    def test_non_admin_blocked_403(self, session, demo_auth):
        r = session.get(f"{API}/admin/users", headers=demo_auth["headers"])
        assert r.status_code == 403

    def test_no_auth_returns_401(self, session):
        r = session.get(f"{API}/admin/users")
        assert r.status_code == 401


# ---------------- Admin: grant ----------------
class TestAdminGrant:
    def test_grant_xp_and_coins(self, session, admin_auth):
        target = _register(session)
        before = target["user"]
        body = {"user_id": before["id"], "xp": 100, "coins": 25}
        r = session.post(f"{API}/admin/grant", json=body, headers=admin_auth["headers"])
        assert r.status_code == 200, r.text
        out = r.json()
        assert out["granted_xp"] == 100
        assert out["granted_coins"] == 25

        # Verify persistence via /auth/me of target user
        me = session.get(f"{API}/auth/me", headers=target["headers"]).json()
        assert me["xp"] == before["xp"] + 100
        assert me["coins"] == before["coins"] + 25

    def test_grant_unknown_user_404(self, session, admin_auth):
        r = session.post(
            f"{API}/admin/grant",
            json={"user_id": "nonexistent-id-xyz", "xp": 10, "coins": 0},
            headers=admin_auth["headers"],
        )
        assert r.status_code == 404

    def test_grant_nothing_returns_400(self, session, admin_auth, demo_auth):
        r = session.post(
            f"{API}/admin/grant",
            json={"user_id": demo_auth["user"]["id"], "xp": 0, "coins": 0},
            headers=admin_auth["headers"],
        )
        assert r.status_code == 400

    def test_non_admin_cannot_grant(self, session, demo_auth):
        r = session.post(
            f"{API}/admin/grant",
            json={"user_id": demo_auth["user"]["id"], "xp": 10, "coins": 0},
            headers=demo_auth["headers"],
        )
        assert r.status_code == 403


# ---------------- Admin: ban & login enforcement ----------------
class TestAdminBan:
    def test_ban_then_login_blocked_then_unban(self, session, admin_auth):
        target = _register(session)
        # Pre-ban login works
        pre = session.post(f"{API}/auth/login", json={
            "email": target["payload"]["email"], "password": target["payload"]["password"]
        })
        assert pre.status_code == 200

        # Ban
        r = session.post(
            f"{API}/admin/ban",
            json={"user_id": target["user"]["id"], "banned": True},
            headers=admin_auth["headers"],
        )
        assert r.status_code == 200, r.text
        assert r.json()["is_banned"] is True

        # Login should now 403 with suspended message
        post = session.post(f"{API}/auth/login", json={
            "email": target["payload"]["email"], "password": target["payload"]["password"]
        })
        assert post.status_code == 403
        assert "suspend" in post.json()["detail"].lower()

        # Unban
        r2 = session.post(
            f"{API}/admin/ban",
            json={"user_id": target["user"]["id"], "banned": False},
            headers=admin_auth["headers"],
        )
        assert r2.status_code == 200
        assert r2.json()["is_banned"] is False

        # Login works again
        again = session.post(f"{API}/auth/login", json={
            "email": target["payload"]["email"], "password": target["payload"]["password"]
        })
        assert again.status_code == 200

    def test_cannot_ban_admin(self, session, admin_auth):
        r = session.post(
            f"{API}/admin/ban",
            json={"user_id": admin_auth["user"]["id"], "banned": True},
            headers=admin_auth["headers"],
        )
        assert r.status_code == 400

    def test_ban_unknown_user_404(self, session, admin_auth):
        r = session.post(
            f"{API}/admin/ban",
            json={"user_id": "unknown-id-xyz", "banned": True},
            headers=admin_auth["headers"],
        )
        assert r.status_code == 404

    def test_non_admin_cannot_ban(self, session, demo_auth):
        r = session.post(
            f"{API}/admin/ban",
            json={"user_id": demo_auth["user"]["id"], "banned": True},
            headers=demo_auth["headers"],
        )
        assert r.status_code == 403


# ---------------- Rewarded ad ----------------
class TestWatchAd:
    def test_watch_ad_awards_then_rate_limited(self, session):
        # Use a fresh user so cooldown is guaranteed open
        u = _register(session)
        h = u["headers"]
        before_xp = u["user"]["xp"]
        before_coins = u["user"]["coins"]

        r1 = session.post(f"{API}/rewards/watch-ad", headers=h)
        assert r1.status_code == 200, r1.text
        body = r1.json()
        assert body["xp_awarded"] == 40
        assert body["coins_awarded"] == 50
        assert body["user"]["xp"] == before_xp + 40
        assert body["user"]["coins"] == before_coins + 50
        assert body.get("next_claim_in_seconds", 0) >= 3000  # ~1h

        # Second attempt within cooldown -> 429
        r2 = session.post(f"{API}/rewards/watch-ad", headers=h)
        assert r2.status_code == 429
        detail = r2.json()["detail"]
        assert "Try again in" in detail or "again" in detail.lower()

    def test_watch_ad_requires_auth(self, session):
        r = session.post(f"{API}/rewards/watch-ad")
        assert r.status_code == 401


# ---------------- Regression spot checks ----------------
class TestRegression:
    def test_demo_login_still_works(self, demo_auth):
        assert demo_auth["token"]

    def test_quiz_submit_regression(self, session, demo_auth):
        h = demo_auth["headers"]
        qs = session.get(f"{API}/games/quiz/questions", headers=h).json()
        r = session.post(
            f"{API}/games/quiz/submit",
            json={"question_id": qs[0]["id"], "answer_index": 0},
            headers=h,
        )
        assert r.status_code == 200

    def test_missions_regression(self, session, demo_auth):
        r = session.get(f"{API}/missions", headers=demo_auth["headers"])
        assert r.status_code == 200
        keys = {m["key"] for m in r.json()}
        assert keys == {"play_quiz_3", "spin_2", "daily_claim", "tap_100"}

    def test_chat_messages_regression(self, session, demo_auth):
        r = session.get(f"{API}/chat/messages", headers=demo_auth["headers"])
        assert r.status_code == 200
        assert isinstance(r.json(), list)

    def test_leaderboard_regression(self, session):
        r = session.get(f"{API}/leaderboard", params={"period": "all"})
        assert r.status_code == 200
        assert len(r.json()) >= 1

    def test_spin_regression(self, session):
        # Use a fresh user so we don't trip the spin cooldown
        u = _register(session)
        r = session.post(f"{API}/games/spin", headers=u["headers"])
        assert r.status_code == 200
        assert "prize_index" in r.json()

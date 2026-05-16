"""Phase 2 backend tests — Tap, Missions, Chat, real Weekly/Monthly leaderboards."""
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


@pytest.fixture(scope="module")
def session():
    s = requests.Session()
    s.headers.update({"Content-Type": "application/json"})
    return s


def _register(session) -> dict:
    sfx = uuid.uuid4().hex[:8]
    payload = {
        "email": f"test_p2_{sfx}@earnplay.app",
        "username": f"TESTp2_{sfx}",
        "password": "Pass1234!",
    }
    r = session.post(f"{API}/auth/register", json=payload)
    assert r.status_code == 200, r.text
    data = r.json()
    return {"token": data["token"], "user": data["user"], "headers": {"Authorization": f"Bearer {data['token']}"}}


@pytest.fixture(scope="module")
def user_a(session):
    return _register(session)


@pytest.fixture(scope="module")
def user_b(session):
    return _register(session)


# ---------------- Tap Challenge ----------------
class TestTap:
    def test_tap_submit_awards_and_new_best(self, session, user_a):
        h = user_a["headers"]
        me0 = session.get(f"{API}/auth/me", headers=h).json()
        xp0, coins0 = me0["xp"], me0["coins"]

        r = session.post(f"{API}/games/tap/submit", json={"taps": 50, "duration_ms": 15000}, headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["taps"] == 50
        assert body["xp_awarded"] == 10  # 50//5
        assert body["coins_awarded"] == 5  # 50//10
        assert body["is_new_best"] is True
        assert body["best_tap_score"] == 50
        assert body["user"]["xp"] == xp0 + 10
        assert body["user"]["coins"] == coins0 + 5

    def test_tap_submit_not_new_best_when_lower(self, session, user_a):
        h = user_a["headers"]
        r = session.post(f"{API}/games/tap/submit", json={"taps": 20, "duration_ms": 15000}, headers=h)
        assert r.status_code == 200
        b = r.json()
        assert b["is_new_best"] is False
        assert b["best_tap_score"] >= 50

    def test_tap_anti_cheat_clamp(self, session, user_a):
        h = user_a["headers"]
        # 1000 taps in 1s is impossible; should clamp to ~12*1+5 = 17
        r = session.post(f"{API}/games/tap/submit", json={"taps": 1000, "duration_ms": 1000}, headers=h)
        assert r.status_code == 200, r.text
        assert r.json()["taps"] <= 17

    def test_tap_requires_auth(self, session):
        r = session.post(f"{API}/games/tap/submit", json={"taps": 10, "duration_ms": 5000})
        assert r.status_code == 401


# ---------------- Missions ----------------
class TestMissions:
    def test_missions_list_returns_four(self, session, user_b):
        h = user_b["headers"]
        r = session.get(f"{API}/missions", headers=h)
        assert r.status_code == 200, r.text
        items = r.json()
        keys = {m["key"] for m in items}
        assert keys == {"play_quiz_3", "spin_2", "daily_claim", "tap_100"}
        for m in items:
            assert "progress" in m and "claimed" in m and "goal" in m
            assert m["claimed"] is False

    def test_quiz_submit_increments_play_quiz_3(self, session, user_b):
        h = user_b["headers"]
        qs = session.get(f"{API}/games/quiz/questions", headers=h).json()
        session.post(f"{API}/games/quiz/submit", json={"question_id": qs[0]["id"], "answer_index": 0}, headers=h)
        ms = session.get(f"{API}/missions", headers=h).json()
        pq = next(m for m in ms if m["key"] == "play_quiz_3")
        assert pq["progress"] >= 1

    def test_daily_claim_sets_mission(self, session, user_b):
        h = user_b["headers"]
        session.post(f"{API}/rewards/daily-claim", headers=h)
        ms = session.get(f"{API}/missions", headers=h).json()
        dc = next(m for m in ms if m["key"] == "daily_claim")
        assert dc["progress"] == 1

    def test_tap_submit_sets_tap_100(self, session, user_b):
        h = user_b["headers"]
        session.post(f"{API}/games/tap/submit", json={"taps": 75, "duration_ms": 15000}, headers=h)
        ms = session.get(f"{API}/missions", headers=h).json()
        tm = next(m for m in ms if m["key"] == "tap_100")
        # set_value semantics — at least 75 (clamped to goal in response)
        assert tm["progress"] >= min(75, tm["goal"])

    def test_claim_incomplete_returns_400(self, session, user_b):
        h = user_b["headers"]
        # play_quiz_3 likely has progress 1; goal 3 → not complete
        r = session.post(f"{API}/missions/play_quiz_3/claim", headers=h)
        assert r.status_code == 400

    def test_claim_unknown_key_404(self, session, user_b):
        h = user_b["headers"]
        r = session.post(f"{API}/missions/no_such_mission/claim", headers=h)
        assert r.status_code == 404

    def test_claim_daily_complete_then_double_claim(self, session, user_b):
        h = user_b["headers"]
        me0 = session.get(f"{API}/auth/me", headers=h).json()
        r = session.post(f"{API}/missions/daily_claim/claim", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["xp_awarded"] == 10
        assert body["coins_awarded"] == 5
        assert body["user"]["xp"] == me0["xp"] + 10
        # already claimed
        r2 = session.post(f"{API}/missions/daily_claim/claim", headers=h)
        assert r2.status_code == 400

    def test_claim_tap_100_when_complete(self, session, user_b):
        h = user_b["headers"]
        # bump tap to 100+ to satisfy goal (set_value semantics)
        session.post(f"{API}/games/tap/submit", json={"taps": 120, "duration_ms": 15000}, headers=h)
        r = session.post(f"{API}/missions/tap_100/claim", headers=h)
        assert r.status_code == 200, r.text
        body = r.json()
        assert body["xp_awarded"] == 40
        assert body["coins_awarded"] == 25


# ---------------- Chat ----------------
class TestChat:
    def test_get_chat_requires_auth(self, session):
        r = session.get(f"{API}/chat/messages")
        assert r.status_code == 401

    def test_get_chat_sorted_oldest_first(self, session, user_a):
        h = user_a["headers"]
        r = session.get(f"{API}/chat/messages", headers=h)
        assert r.status_code == 200, r.text
        items = r.json()
        assert isinstance(items, list)
        assert len(items) <= 50
        if len(items) >= 2:
            assert items[0]["created_at"] <= items[-1]["created_at"]

    def test_send_chat_message_persists(self, session, user_a):
        h = user_a["headers"]
        text = f"TEST hello {uuid.uuid4().hex[:6]}"
        r = session.post(f"{API}/chat/messages", json={"text": text}, headers=h)
        assert r.status_code == 200, r.text
        msg = r.json()
        assert msg["text"] == text
        assert msg["user_id"] == user_a["user"]["id"]

        # verify in list
        items = session.get(f"{API}/chat/messages", headers=h).json()
        assert any(m["text"] == text for m in items)

    def test_send_empty_chat_returns_422(self, session, user_a):
        h = user_a["headers"]
        r = session.post(f"{API}/chat/messages", json={"text": ""}, headers=h)
        assert r.status_code == 422


# ---------------- Leaderboard windows ----------------
class TestLeaderboardWindows:
    def test_weekly_contains_recent_earner(self, session, user_a):
        # user_a earned XP via tap & quiz above
        r = session.get(f"{API}/leaderboard", params={"period": "weekly"})
        assert r.status_code == 200, r.text
        items = r.json()
        usernames = [i["username"] for i in items]
        assert user_a["user"]["username"] in usernames

    def test_monthly_returns_list(self, session):
        r = session.get(f"{API}/leaderboard", params={"period": "monthly"})
        assert r.status_code == 200
        items = r.json()
        xps = [i["xp"] for i in items]
        assert xps == sorted(xps, reverse=True)

    def test_all_still_uses_user_xp(self, session):
        r = session.get(f"{API}/leaderboard", params={"period": "all"})
        assert r.status_code == 200
        items = r.json()
        assert len(items) >= 1
        # demo seed users have known XPs; AceMaster=1240 should appear & be high
        ace = next((i for i in items if i["username"] == "AceMaster"), None)
        assert ace is not None
        assert ace["xp"] >= 1240

from datetime import date, datetime, timezone

from fastapi.testclient import TestClient

from app.main import app, fetch_tasks
from app.schemas import Task
from app.stats import compute_summary

TODAY = date(2026, 10, 6)


def make_task(**overrides) -> Task:
    data = {
        "id": "1",
        "title": "Task",
        "status": "todo",
        "priority": "medium",
        "created_at": datetime(2026, 10, 1, tzinfo=timezone.utc),
    }
    data.update(overrides)
    return Task(**data)


def test_empty_list_returns_zeroes():
    s = compute_summary([], TODAY)
    assert s.total == 0
    assert s.completion_rate == 0.0
    assert len(s.completed_per_day) == 14
    assert all(d.count == 0 for d in s.completed_per_day)


def test_counts_and_completion_rate():
    tasks = [
        make_task(status="done", completed_at=datetime(2026, 10, 5, 9, tzinfo=timezone.utc)),
        make_task(status="in_progress", priority="high"),
        make_task(status="todo"),
        make_task(status="done", priority="low", completed_at=datetime(2026, 10, 6, 9, tzinfo=timezone.utc)),
    ]
    s = compute_summary(tasks, TODAY)
    assert s.by_status == {"todo": 1, "in_progress": 1, "done": 2}
    assert s.by_priority == {"low": 1, "medium": 2, "high": 1}
    assert s.completion_rate == 0.5
    assert [d.count for d in s.completed_per_day[-2:]] == [1, 1]


def test_overdue_and_due_this_week_ignore_done_tasks():
    tasks = [
        make_task(due_date=date(2026, 10, 1)),                      # overdue
        make_task(due_date=date(2026, 10, 1), status="done"),       # done: ignored
        make_task(due_date=date(2026, 10, 10)),                     # due this week
        make_task(due_date=date(2026, 11, 1)),                      # later
    ]
    s = compute_summary(tasks, TODAY)
    assert s.overdue == 1
    assert s.due_this_week == 1


def test_summary_endpoint_uses_injected_tasks():
    app.dependency_overrides[fetch_tasks] = lambda: [make_task(status="done")]
    try:
        response = TestClient(app).get("/api/analytics/summary?days=7")
        assert response.status_code == 200
        body = response.json()
        assert body["total"] == 1
        assert len(body["completed_per_day"]) == 7
    finally:
        app.dependency_overrides.clear()


def test_health():
    assert TestClient(app).get("/health").json() == {"status": "ok"}

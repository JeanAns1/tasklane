"""Pure functions that turn a list of tasks into dashboard metrics.

Kept free of I/O so they are trivial to unit-test.
"""

from collections import Counter
from datetime import date, timedelta

from .schemas import DailyCount, Summary, Task

STATUSES = ("todo", "in_progress", "done")
PRIORITIES = ("low", "medium", "high")


def compute_summary(tasks: list[Task], today: date, days: int = 14) -> Summary:
    status_counts = Counter(t.status for t in tasks)
    priority_counts = Counter(t.priority for t in tasks)
    open_tasks = [t for t in tasks if t.status != "done"]

    overdue = sum(1 for t in open_tasks if t.due_date and t.due_date < today)
    week_end = today + timedelta(days=7)
    due_this_week = sum(1 for t in open_tasks if t.due_date and today <= t.due_date <= week_end)

    window_start = today - timedelta(days=days - 1)
    done_per_day = Counter(
        t.completed_at.date()
        for t in tasks
        if t.completed_at and window_start <= t.completed_at.date() <= today
    )
    completed_per_day = [
        DailyCount(date=window_start + timedelta(days=i), count=done_per_day[window_start + timedelta(days=i)])
        for i in range(days)
    ]

    total = len(tasks)
    return Summary(
        total=total,
        by_status={s: status_counts.get(s, 0) for s in STATUSES},
        by_priority={p: priority_counts.get(p, 0) for p in PRIORITIES},
        completion_rate=round(status_counts.get("done", 0) / total, 3) if total else 0.0,
        overdue=overdue,
        due_this_week=due_this_week,
        completed_per_day=completed_per_day,
    )

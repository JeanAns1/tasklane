from datetime import date, datetime
from typing import Literal

from pydantic import BaseModel

Status = Literal["todo", "in_progress", "done"]
Priority = Literal["low", "medium", "high"]


class Task(BaseModel):
    """Subset of the task fields the analytics service relies on."""

    id: str
    title: str
    status: Status
    priority: Priority
    due_date: date | None = None
    created_at: datetime
    completed_at: datetime | None = None


class DailyCount(BaseModel):
    date: date
    count: int


class Summary(BaseModel):
    total: int
    by_status: dict[Status, int]
    by_priority: dict[Priority, int]
    completion_rate: float
    overdue: int
    due_this_week: int
    completed_per_day: list[DailyCount]

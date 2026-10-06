import os
from datetime import date

import httpx
from fastapi import Depends, FastAPI, HTTPException, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import TypeAdapter, ValidationError

from .schemas import Summary, Task
from .stats import compute_summary

TASKS_API_URL = os.getenv("TASKS_API_URL", "http://localhost:3000")

app = FastAPI(
    title="Tasklane Analytics API",
    description="Computes dashboard metrics from the Tasks API.",
    version="1.0.0",
)
app.add_middleware(CORSMiddleware, allow_origins=["*"], allow_methods=["GET"], allow_headers=["*"])

_tasks_adapter = TypeAdapter(list[Task])


async def fetch_tasks() -> list[Task]:
    """Dependency: loads every task from the Tasks API (overridden in tests)."""
    try:
        async with httpx.AsyncClient(base_url=TASKS_API_URL, timeout=5.0) as client:
            response = await client.get("/api/tasks")
            response.raise_for_status()
    except httpx.HTTPError as exc:
        raise HTTPException(status_code=502, detail=f"Tasks API unreachable: {exc}") from exc

    try:
        return _tasks_adapter.validate_python(response.json())
    except ValidationError as exc:
        raise HTTPException(status_code=502, detail="Tasks API returned unexpected data") from exc


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


@app.get("/api/analytics/summary", response_model=Summary)
async def summary(
    days: int = Query(14, ge=1, le=90, description="Size of the completion history window"),
    tasks: list[Task] = Depends(fetch_tasks),
) -> Summary:
    return compute_summary(tasks, today=date.today(), days=days)

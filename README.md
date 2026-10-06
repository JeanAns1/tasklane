# Tasklane

![CI](https://github.com/JeanAns1/tasklane/actions/workflows/ci.yml/badge.svg)
![Node.js](https://img.shields.io/badge/Node.js-20-339933?logo=node.js&logoColor=white)
![Python](https://img.shields.io/badge/Python-3.12-3776AB?logo=python&logoColor=white)
![React](https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=black)
![Docker](https://img.shields.io/badge/Docker-Compose-2496ED?logo=docker&logoColor=white)

A task board with a live progress dashboard, built as a small microservice system:
a **React** front-end, a **Node.js / Express** REST API, a **Python / FastAPI** analytics
service and a **PostgreSQL** database â€” all orchestrated with **Docker Compose**.

![Tasklane screenshot](docs/screenshot.png)

---

## Quick start

The only requirement is [Docker](https://docs.docker.com/get-docker/) (with Docker Compose v2).

```bash
git clone https://github.com/JeanAns1/tasklane.git
cd tasklane
docker compose up --build
```

**That's it.** Open **http://localhost:8080** in your browser.

To stop the application, press `Ctrl + C`, then run `docker compose down`
(add `-v` to also delete the database volume).

> No configuration file is required: sensible defaults are built in.
> To change the port or database credentials, copy `.env.example` to `.env` and edit it.

---

## Features

- Create tasks with a priority and an optional due date
- Move tasks across three lanes: **To do â†’ In progress â†’ Done**
- Dashboard with tasks completed per day over the last 14 days, open / overdue / due-soon counts and overall completion rate
- Responsive layout, light and dark mode, keyboard accessible

## Architecture

```mermaid
flowchart LR
    U[Browser] -->|:8080| N[frontend<br/>Nginx + React build]
    N -->|/api/tasks| T[tasks-api<br/>Node.js / Express]
    N -->|/api/analytics| A[analytics-api<br/>Python / FastAPI]
    A -->|HTTP| T
    T -->|SQL| D[(PostgreSQL)]
```

| Service         | Stack                          | Responsibility                                         |
| --------------- | ------------------------------ | ------------------------------------------------------ |
| `frontend`      | React 18, Vite, Nginx          | UI; Nginx serves the build and reverse-proxies the APIs |
| `tasks-api`     | Node.js 20, Express, `pg`      | CRUD for tasks, input validation, schema creation      |
| `analytics-api` | Python 3.12, FastAPI, Pydantic | Computes dashboard metrics from the Tasks API          |
| `db`            | PostgreSQL 16                  | Persistent storage (named volume `db-data`)            |

**Design choices**

- **Single entry point.** The browser only talks to Nginx, which routes `/api/*` to the right service. No CORS setup, no API URL baked into the front-end build.
- **Clear service boundary.** The analytics service never touches the database; it consumes the Tasks API over HTTP, like a real downstream consumer.
- **Testable by design.** The Express app receives its repository as a dependency (PostgreSQL in production, in-memory in tests). The analytics logic is a pure function, and the FastAPI data source is an overridable dependency.
- **Production-minded containers.** Multi-stage front-end build, non-root users, health checks, and `depends_on: service_healthy` so services start in the right order.

## API reference

### Tasks API (Express)

| Method   | Endpoint               | Description                                   |
| -------- | ---------------------- | --------------------------------------------- |
| `GET`    | `/api/tasks`           | List tasks (optional `?status=todo\|in_progress\|done`) |
| `GET`    | `/api/tasks/:id`       | Get one task                                  |
| `POST`   | `/api/tasks`           | Create a task                                 |
| `PATCH`  | `/api/tasks/:id`       | Update any field of a task                    |
| `DELETE` | `/api/tasks/:id`       | Delete a task                                 |
| `GET`    | `/health`              | Health check                                  |

Example:

```bash
curl -X POST http://localhost:8080/api/tasks \
  -H "Content-Type: application/json" \
  -d '{"title": "Write the docs", "priority": "high", "due_date": "2026-12-31"}'
```

Task fields: `title` (required, max 120 chars), `description`, `status`
(`todo` | `in_progress` | `done`), `priority` (`low` | `medium` | `high`), `due_date` (`YYYY-MM-DD`).
Invalid payloads return `422` with a list of validation errors.

### Analytics API (FastAPI)

| Method | Endpoint                          | Description                                        |
| ------ | --------------------------------- | -------------------------------------------------- |
| `GET`  | `/api/analytics/summary?days=14`  | Totals by status and priority, completion rate, overdue count, completions per day |
| `GET`  | `/health`                         | Health check                                       |

FastAPI also generates interactive docs. To browse them, expose the service port
(add `ports: ["8000:8000"]` to `analytics-api` in `docker-compose.yml`) and open http://localhost:8000/docs.

## Project structure

```
tasklane/
â”œâ”€â”€ docker-compose.yml          # Orchestrates the 4 services
â”œâ”€â”€ .env.example                # Optional overrides
â”œâ”€â”€ .github/workflows/ci.yml    # Tests + Docker build on every push / PR
â””â”€â”€ services/
    â”œâ”€â”€ tasks-api/              # Node.js / Express
    â”‚   â”œâ”€â”€ Dockerfile
    â”‚   â”œâ”€â”€ src/
    â”‚   â”‚   â”œâ”€â”€ app.js          # Express app factory
    â”‚   â”‚   â”œâ”€â”€ index.js        # Entry point (Postgres wiring, graceful shutdown)
    â”‚   â”‚   â”œâ”€â”€ validation.js
    â”‚   â”‚   â”œâ”€â”€ routes/tasks.js
    â”‚   â”‚   â””â”€â”€ repositories/   # postgresRepository.js, memoryRepository.js
    â”‚   â””â”€â”€ tests/
    â”œâ”€â”€ analytics-api/          # Python / FastAPI
    â”‚   â”œâ”€â”€ Dockerfile
    â”‚   â”œâ”€â”€ app/                # main.py, stats.py, schemas.py
    â”‚   â””â”€â”€ tests/
    â””â”€â”€ frontend/               # React / Vite
        â”œâ”€â”€ Dockerfile          # Multi-stage: build with Node, serve with Nginx
        â”œâ”€â”€ nginx.conf
        â””â”€â”€ src/
```

## Local development (without Docker)

Requirements: Node.js 20+, Python 3.12+, a PostgreSQL instance.

```bash
# 1. Tasks API  â†’  http://localhost:3000
cd services/tasks-api
npm install
DATABASE_URL=postgres://tasklane:tasklane@localhost:5432/tasklane npm run dev

# 2. Analytics API  â†’  http://localhost:8000
cd services/analytics-api
python -m venv .venv && source .venv/bin/activate
pip install -r requirements-dev.txt
uvicorn app.main:app --reload

# 3. Frontend  â†’  http://localhost:5173 (Vite proxies /api to the two services)
cd services/frontend
npm install
npm run dev
```

Tip: `docker compose up db` starts only the database.

## Tests

```bash
cd services/tasks-api && npm test          # Node built-in test runner + Supertest
cd services/analytics-api && pytest -q     # pytest + FastAPI TestClient
```

The same checks run in GitHub Actions on every push and pull request, followed by a full `docker compose build`.

## Git workflow

- `main` â€” stable, release-ready code
- `develop` â€” integration branch
- `feature/*` and `fix/*` â€” created from `develop`, merged back through pull requests

## Roadmap

- Authentication (JWT) and per-user boards
- Drag-and-drop between lanes
- Database migrations with a dedicated tool
- Deployment guide (VPS + reverse proxy + HTTPS)

## License

[MIT](LICENSE) Â© Jean Ans-Lee RAHARINIRINA

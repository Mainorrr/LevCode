# Online Judge — Agent Context

## Project Overview

An **online judge for beginner Python 3 programming** built for academic research purposes.

---

## Project Structure (Monorepo)

```
online-judge/
├── frontend/     → React app (deployed on Vercel)
├── backend/      → Node.js + Express (deployed on Railway with Docker)
└── docker/       → Python 3 sandbox container
```

---

## What the System Does

- Users enter basic info (name, student ID, or similar) with **no authentication**
- Users submit Python 3 code through the frontend
- Backend receives the code and runs it inside an **isolated Docker container** with strict limits:
  - 5 second timeout
  - 128MB RAM limit
  - No network access
- Returns runtime errors or successful output to the user
- Every submission is **saved to the database** to track per-user statistics for research purposes (submission count, errors, pass rate, timestamps, code history)

---

## Tech Stack

| Layer              | Technology                                    | Hosting                           |
| ------------------ | --------------------------------------------- | --------------------------------- |
| Frontend           | React + CodeMirror                            | Vercel                            |
| Backend            | Node.js + Express                             | Railway                           |
| Python 3 Execution | Docker (python:3.11-slim) via child_process   | Railway (built-in Docker support) |
| Database           | PostgreSQL                                    | Railway or Supabase               |

> **No authentication** — users identify themselves with basic form fields on entry.
> **Max load:** ~60 simultaneous users.

---

## Database Goals

- Store every submission with: user info, submitted code, output/errors, execution time, and pass/fail result
- Allow querying statistics per user and per problem for research analysis

---

## Current Priorities

1. Docker sandbox setup for safe Python 3 execution
2. REST API for code submission and result retrieval
3. Database schema for storing submissions and user statistics
4. React frontend with code editor (CodeMirror)

---

## Agent Instructions

Please help build this project step by step. Before writing any code, consider:

- **Security first:** Python 3 code must always run inside the Docker sandbox, never directly on the host
- **Keep it simple:** No auth, no overengineering — this is a research tool
- **Monorepo conventions:** Respect the `frontend/`, `backend/`, and `docker/` folder separation
- **Railway constraints:** Backend and Docker run together on Railway; frontend is separate on Vercel
- **Database:** Every single submission must be persisted, even failed ones, for research completeness

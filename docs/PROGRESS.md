# AI Notes & Document Manager — Plan + Progress Log

> **Mirrored in TWO places — keep both in sync:**
> - In-repo: `docs/PROGRESS.md`
> - Agent session-start file: `C:\Users\tawfi\.opencode\plan\project-plan-and-progress.md`
>
> **Single source of truth.** First file to read at the start of EVERY session.
> Update it at the end of every session (append to the Progress Log, refresh Current State).

---

## 0. START HERE — session protocol

**At the start of every session, in this order:**
1. Read **§7 Current State / Next Action** and the most recent entry in **§6 Progress Log**.
2. Read **§5 Next Up** to see the plan for the current level.
3. Read **§8 Open Items**.
4. Confirm scope with the user before writing code.
5. Implement ONE level only; verify it (tests/lint/build/HTTP) before moving on.

**At the end of every session:**
- Append a dated entry to **§6 Progress Log** (what changed, evidence, deviations, blockers).
- Update **§7 Current State** and **§5 Next Up**.
- Update BOTH mirrored copies of this file.
- List key files created/changed so the next session does not have to rediscover them.

**Golden rules:** one level at a time · don't rewrite working code · explain every new dependency and file change · never commit secrets · backend owns data + AI, frontend talks only to Supabase Auth/Storage + FastAPI.

---

## 1. Project summary

AI-powered notes and document management web app for students and professionals.
Store notes, organize into folders, upload/view PDFs, and use AI to summarize,
answer questions, and (eventually) generate flashcards/quizzes.

**Stack:** React + TypeScript + Vite + Tailwind + React Router + TanStack Query (frontend),
FastAPI + SQLAlchemy (async) + Alembic + Pydantic v2 (backend), PostgreSQL + Auth + Storage via Supabase.

**Core architectural rules (non-negotiable):**
1. Frontend talks only to (a) Supabase Auth/Storage directly (public/publishable key) and (b) FastAPI for all business data. No DB access or secrets in frontend.
2. Backend owns all business data + all AI calls. Authenticates via Supabase JWT verification. Uses the secret (service-role) key server-side only.
3. AI is behind an `AIService` interface; the rest of the app never imports a concrete provider.
4. Never expose API keys in frontend. Secrets in env vars only.
5. One feature/level at a time. Don't rewrite working code. Explain every dependency and file change.

---

## 2. Environment & how to run

**Local machine (verified 2026-10-08):** Windows, Node v24.13.0, npm 11.20.0, Python 3.11.9, pip 24.0, git 2.55.0. **Docker and Supabase CLI are NOT installed.**

**Repo root:** `C:\Users\tawfi\OneDrive\Desktop\note taker` (git repo, branch `main`).

**Commits so far:** `27101e8` (Levels 0–2) · `a551f35` (Level 3).

| Task | Command | Notes |
|---|---|---|
| Backend dev server | `cd backend` → `.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload` | health: `http://127.0.0.1:8000/api/v1/health` |
| Backend tests | `cd backend` → `.\.venv\Scripts\python.exe -m pytest -q` | |
| Backend lint | `cd backend` → `.\.venv\Scripts\python.exe -m ruff check .` | |
| Frontend dev server | `cd frontend` → `npm run dev` | `http://localhost:5173` |
| Frontend checks | `cd frontend` → `npm run typecheck` / `npm run lint` / `npm run test` / `npm run build` | |
| Create migration | `cd backend` → `.\.venv\Scripts\alembic.exe revision --autogenerate -m "<msg>"` | needs DB URL in `.env` |

**Key file map (backend):** `app/main.py` (app factory) · `app/core/config.py` (settings) · `app/db/base.py` (declarative base) · `app/db/session.py` (engine/`get_db`) · `app/api/v1/router.py` (route aggregation) · `alembic/env.py` (migrations read settings).

**Key file map (frontend):** `src/main.tsx` (entry) · `src/app/AppProviders.tsx` (providers) · `src/app/router.tsx` (routes) · `src/lib/queryClient.ts` · `src/lib/supabase.ts` (auth client) · `src/config/env.ts` (typed env) · `src/components/ui/*` (primitives) · `src/features/*` (feature folders) · `vite.config.ts` (aliases + vitest).

**Design system (locked):** warm paper/books — cream bg, parchment surfaces, ink text, terracotta ("clay") accent. Tokens in `src/index.css` `@theme`. Fonts: Noto Serif (display) + Noto Sans (body) via Google Fonts.

**Git identity:** currently a PLACEHOLDER — `Tawfiq (placeholder) <placeholder@example.com>` set with `--local`. Amend commit `27101e8` once real name/email is provided.

---

## 3. Decisions log

| # | Decision | Status | Notes |
|---|---|---|---|
| 1 | Python tooling: `pip + venv` | ✅ Confirmed | Zero new installs; `uv` optional later |
| 2 | Local dev DB: Supabase cloud | ✅ Confirmed | Docker not installed |
| 3 | Tailwind v4 | ✅ Confirmed | CSS-first config via `@tailwindcss/vite` |
| 4 | PDF viewer: `react-pdf` (pdf.js) | ✅ Confirmed | Has text layer for a11y |
| 5 | UI primitives: Radix UI + Tailwind | ✅ Confirmed | Added per-component as needed |
| 6 | Frontend linter: oxlint (template default) + Prettier | ✅ In use | Vite 8 template shipped oxlint, not ESLint |
| 7 | Auth scope (Level 3): email + password only | ✅ Confirmed | No OAuth/sign-up/forgot per user |
| 8 | Design direction: warm paper/books | ✅ Confirmed | User-supplied login sketch |

### 3b. External services — Supabase

- **Project ref:** `ojizxdzbskugfuqcjlvk`
- **Project URL:** `https://ojizxdzbskugfuqcjlvk.supabase.co`
- **Key format:** Supabase's **new-format keys** — a *publishable* key (client-safe) and a *secret* key (server-only).

**Where secrets live (do NOT duplicate secret values in this file):**

| Value | Stored in | Env var |
|---|---|---|
| Project URL | `frontend/.env` + `backend/.env` | `VITE_SUPABASE_URL` / `SUPABASE_URL` |
| Publishable key | `frontend/.env` | `VITE_SUPABASE_ANON_KEY` |
| Secret key | `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` |
| JWT secret | `backend/.env` (NEEDED before Level 4) | `SUPABASE_JWT_SECRET` |
| DB connection string | `backend/.env` (NEEDED before Level 6) | `DATABASE_URL` (use `postgresql+asyncpg://…`) |

Both `.env` files are gitignored. `.env.example` files document the keys with no values.

---

## 4. Development levels

Each level = one verifiable slice. Complete a level, test it, mark it done, move on.

### Level 0 — Foundation (repo scaffolding) — ✅ DONE
- [x] Repo structure: `frontend/`, `backend/`, root `README.md`, `.gitignore`
- [x] `git init` + initial commit
- [x] `.env.example` for both apps (no secrets committed)
- [x] Backend `pyproject.toml` + venv; frontend `package.json` + install

### Level 1 — Backend boots — ✅ DONE
- [x] FastAPI app factory + `main.py`
- [x] `core/config.py` (pydantic-settings) + env loading
- [x] Async SQLAlchemy engine + session factory
- [x] Alembic init + baseline empty migration
- [x] `GET /api/v1/health` returns `{status: "ok"}`

### Level 2 — Frontend boots — ✅ DONE
- [x] Vite + React + TS (strict) + Tailwind v4
- [x] React Router (library mode) with a placeholder route
- [x] TanStack Query `QueryClientProvider`
- [x] oxlint + Prettier + typecheck + test scripts
- [x] A rendered "app shell placeholder" page

### Level 3 — Auth (frontend) — ✅ DONE & VERIFIED
- [x] Typed env access (`src/config/env.ts` + `src/vite-env.d.ts`)
- [x] Supabase JS client (`src/lib/supabase.ts`), single instance
- [x] Login page (email/password) with loading/error states — warm paper theme
- [x] Session handling (`useSession`) + sign-out in shell
- [x] **Manual check:** user created a Supabase user and signed in successfully; session persists on reload
- **Notes:** Google OAuth / sign-up / forgot-password intentionally NOT built (per user). Route guard deferred to Level 5. Committed `a551f35`.

### Level 4 — Auth (backend) — ⬅ NEXT
- [ ] Supabase JWT verification dependency (`get_current_user`)
- [ ] `GET /auth/me` returning identity from the verified token
- [ ] (Deferred to Level 6: `profiles` table + auto-create + `PATCH /auth/me`)
- **Done when:** valid token → 200 with identity; missing/invalid → 401.

### Level 5 — App shell + protected routes
- [ ] Route guard (redirect to `/login` if no session)
- [ ] Sidebar + top bar layout
- [ ] Dashboard route
- **Done when:** unauthenticated users are blocked; shell renders when logged in.

### Level 6 — Folders (backend)
- [ ] `folders` model + migration (+ `profiles` table from the Level 4 deferral)
- [ ] CRUD endpoints + tree listing

### Level 7 — Folders (UI)
- [ ] Folder tree in sidebar, create/rename/delete/move
- [ ] Empty/loading/error states, keyboard nav

### Level 8 — Notes (backend)
- [ ] `notes` model + migration
- [ ] CRUD endpoints + list w/ folder filter + pagination

### Level 9 — Notes (UI)
- [ ] Note list + full-page editor + autosave
- [ ] Loading/empty/error states

### Level 10 — Document upload + extraction (backend)
- [ ] `documents`, `document_chunks`, `jobs` models + migrations
- [ ] Storage upload (Supabase) + extraction job + status polling
- [ ] PyMuPDF text extraction + chunking

### Level 11 — Document UI
- [ ] Upload dropzone, document list, processing status UI

### Level 12 — PDF viewer
- [ ] Signed storage URL endpoint
- [ ] `react-pdf` viewer in document workspace

### Level 13 — AI summary
- [ ] `AIService` protocol + `OpenAICompatibleProvider` + DeepSeek impl + factory
- [ ] `/summary` job endpoint + polling
- [ ] Summary panel UI

### Level 14 — Document Q&A
- [ ] Retrieval service (keyword first)
- [ ] `/ask` + conversation history
- [ ] Q&A panel UI

### Level 15 — Global search
- [ ] Unified `/search` (notes + extracted text, FTS + trigram)
- [ ] Search UI + results page

### Level 16 — Flashcards & quizzes
- [ ] Structured-output generation + Pydantic validation
- [ ] Flashcard + quiz view components

### Level 17 — Hardening + deploy
- [ ] Test depth, a11y audit, error handling, pagination, optimistic updates
- [ ] Deploy: frontend (Vercel/Netlify), backend (Render), Supabase

---

## 5. Next Up — Level 4 (Auth, backend)

**Goal:** the FastAPI backend can verify a Supabase JWT and identify the caller — no database needed yet.

**Prerequisite value:** `SUPABASE_JWT_SECRET` in `backend/.env` (Supabase → Settings → API → JWT Settings, or Settings → Authentication → JWT Settings).

**Dependency:** `PyJWT` — verify the HS256 signature of the Supabase access token.

**Files to create/change (backend):**
- `backend/.env` — create from `.env.example`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_JWT_SECRET` (leave `DATABASE_URL` as the placeholder this level).
- `app/core/security.py` — `get_current_user` dependency: read `Authorization: Bearer <token>`, verify signature/expiry with the JWT secret, return `{ id, email }`; 401 on missing/invalid/expired.
- `app/schemas/auth.py` — `CurrentUser` response model.
- `app/api/v1/auth.py` — `GET /auth/me` returning the verified identity from the token claims.
- Wire into `app/api/v1/router.py`.
- Tests: valid token → 200; missing/invalid/expired → 401.

**Acceptance:** `/api/v1/auth/me` with a real Supabase access token → the user's id + email; without/with a bad token → 401.

**Deferred to Level 6:** `profiles` table, auto-create on first login, `PATCH /auth/me` (all need `DATABASE_URL`).

### Design system (locked for the app)
- **Direction:** warm, paper/books. Cream background, parchment surfaces, warm-brown "ink" text, terracotta ("clay") accent. Tokens in `src/index.css` under `@theme`.
- **Fonts:** Noto Serif (display/headings) + Noto Sans (body/UI), via Google Fonts in `index.html`.
- **Login page:** warm card, heading "Welcome", sub-line "Sign in to continue.", email + password with show/hide toggle. No OAuth/sign-up/forgot-password (user decision).
- **Reusable primitives:** `Button`, `Input`, `PasswordInput` (`src/components/ui/`), plus `cn()` helper (`src/lib/cn.ts`).

> **Standing rule:** for any UI/visual work, STOP and present design choices to the user BEFORE implementing. Infrastructure/logic can proceed; look-and-feel is a joint decision.

---

## 6. Progress log

<!-- Append a dated entry at the END of every session. Never delete old entries. -->

### 2026-10-08 — Planning session
- Inspected repo: **empty** (greenfield).
- Environment confirmed: Node v24.13.0, npm 11.20.0, Python 3.11.9, pip 24.0, git 2.55.0. Docker + Supabase CLI NOT installed.
- Produced full architecture proposal (monorepo, schema, API, routing, auth, state, PDF, AI, deploy, phases).
- Created this plan file. Level 0–2 defined as the first scope.

### 2026-10-08 — Implementation session (Levels 0–2) ✅
- All 5 decisions confirmed by user; proceeded with defaults.
- **Level 0 done:** monorepo scaffold (`frontend/`, `backend/`), `.gitignore`, root README, `.env.example` for both apps, `git init` (branch `main`), first commit `27101e8`.
- **Level 1 done:** FastAPI app factory, `pydantic-settings` config, async SQLAlchemy engine + session, Alembic (async) with empty baseline revision `7b960e020541`, `GET /api/v1/health` → `{"status":"ok"}`.
  - Extra: `alembic/env.py` pulls `DATABASE_URL` from settings, `target_metadata = Base.metadata`, offline mode validated; ruff hook formats generated migrations.
- **Level 2 done:** Vite 8 + React 19 + TS 6 (strict) + Tailwind v4 + React Router 8 + TanStack Query 5; app shell, dashboard + 404 placeholders; vitest configured.
- **Verification evidence:** backend pytest `1 passed`, ruff clean, `/api/v1/health` → `{"status":"ok"}` over HTTP; frontend typecheck clean, oxlint 0 errors, vitest `1 passed`, `vite build` succeeds.
- **Actual versions:** FastAPI 0.143.0, SQLAlchemy 2.1.4, Alembic 1.20.0, Pydantic 2.14.0, uvicorn 0.54.0, pytest 9.1.1; React 19.2, Vite 8.3, TypeScript 6.0, Tailwind 4.3, React Router 8.4, TanStack Query 5.104, Vitest 5.0.3.
- **Deviations from plan:** Vite template shipped **oxlint** instead of ESLint (kept it; added Prettier). TypeScript 6 deprecates `baseUrl`, so path alias uses `paths` without `baseUrl`.

### 2026-10-08 — Supabase setup + documentation session
- User created a Supabase project and provided: project ref `ojizxdzbskugfuqcjlvk`, Project URL `https://ojizxdzbskugfuqcjlvk.supabase.co`, and the new-format **publishable** + **secret** keys.
- Mapped keys: publishable → frontend `VITE_SUPABASE_ANON_KEY`; secret → backend `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- **Still to collect:** `SUPABASE_JWT_SECRET` (before Level 4) and `DATABASE_URL` (before Level 6).
- Restructured this document into the authoritative session-start reference.

### 2026-10-08 — Level 3 implementation (Auth, frontend) ✅
- **Design direction agreed with user:** warm/paper/books. User supplied a login-page sketch; simplified to email + password only ("Welcome", no OAuth/sign-up/forgot).
- **Installed:** `@supabase/supabase-js`.
- **Created:**
  - `frontend/.env` (gitignored) — API base URL, Supabase URL, publishable key.
  - `src/vite-env.d.ts`, `src/config/env.ts` (typed, fail-fast env).
  - `src/lib/supabase.ts` (single client), `src/lib/cn.ts`.
  - `src/components/ui/` — `Button`, `Input`, `PasswordInput`, `icons.tsx`.
  - `src/features/auth/useSession.ts`, `src/features/auth/LoginPage.tsx`, `LoginPage.test.tsx`.
- **Changed:** `index.html` (Noto fonts), `src/index.css` (warm `@theme` tokens), `src/app/router.tsx` (`/login`), `src/components/layout/AppShell.tsx` (sign-in link / user + sign-out), `src/features/dashboard/DashboardPage.tsx` (re-themed).
- **Verification:** typecheck clean · oxlint 0 errors · vitest `4 passed` · `vite build` succeeds. `/login` → 200.
- **Known:** JS chunk ~560 kB due to `@supabase/supabase-js` (code-split later if desired).
- **Committed:** `a551f35`.

### 2026-10-08 — Level 3 verified + in-repo progress doc
- User created a Supabase user and **signed in successfully** → **Level 3 verified working** end-to-end (sign in, session persists, sign-out).
- Decision: maintain this progress doc in BOTH the repo (`docs/PROGRESS.md`) and the agent plan dir; keep them in sync.
- **Status:** ready for Level 4; still need `SUPABASE_JWT_SECRET`.

---

## 7. Current state / next action

- **Where we are:** Levels 0–3 complete and verified. Commits: `27101e8` (Levels 0–2), `a551f35` (Level 3).
- **Backend:** boots; `/api/v1/health` works; venv at `backend/.venv`; `backend/.env` not created yet.
- **Frontend:** email + password sign-in works end-to-end (verified by user); dev server `http://localhost:5173`.
- **Next action:** implement **Level 4 — Auth (backend)** (§5) once `SUPABASE_JWT_SECRET` is available.
- **Do not forget:** end each session by appending to §6 and updating §5/§7 in BOTH mirrored files.

---

## 8. Open items / TODOs

1. **Git identity placeholder** — amend `27101e8` once real name/email is provided.
2. **Collect `SUPABASE_JWT_SECRET`** — required before Level 4 (Supabase → Settings → API → JWT Settings).
3. **Collect `DATABASE_URL`** (URI + connection pooler + DB password) — required before Level 6 (first table).
4. **Supabase Auth redirect URLs** — allow-list `http://localhost:5173` (for future email flows).
5. **`backend/.env`** — create at the start of Level 4.
6. **Keep docs in sync** — `docs/PROGRESS.md` ↔ `C:\Users\tawfi\.opencode\plan\project-plan-and-progress.md`.

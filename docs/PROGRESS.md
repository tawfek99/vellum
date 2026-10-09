# AI Notes & Document Manager — Plan + Progress Log

> **Mirrored in TWO places — keep both in sync (write one, then copy):**
> - In-repo: `docs/PROGRESS.md`
> - Agent session-start file: `C:\Users\tawfi\.opencode\plan\project-plan-and-progress.md`
>
> **Single source of truth.** First file to read at the start of EVERY session.
> Update it at the end of every session (append to the Progress Log, refresh Current State).
> Future-level plans are a guide, not a contract — adjust as we learn.

---

## 0. START HERE — session protocol

**At the start of every session, in this order:**
1. Read **§7 Current State / Next Action** and the most recent entry in **§6 Progress Log**.
2. Read **§5 Next Up** for the current level; skim **§4** for what follows.
3. Read **§8 Open Items**.
4. Confirm scope with the user before writing code.
5. Implement ONE level only; verify it (tests/lint/build/HTTP) before moving on.

**At the end of every session:**
- Append a dated entry to **§6 Progress Log** (what changed, evidence, deviations, blockers).
- Update **§7 Current State** and **§5 Next Up** (and mark the finished level in **§4**).
- Update BOTH mirrored copies (write one, then copy).
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

**Commits so far:** `27101e8` (Levels 0–2) · `a551f35` (Level 3) · `299928e`, `c6d9b49` (docs) · `b3d09b4` (Level 4).

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
| 9 | JWT verification: JWKS (ES256/RS256) + legacy HS256 fallback | ✅ Implemented | Reads token `alg`; supabase_url derives JWKS + issuer |

### 3b. External services — Supabase

- **Project ref:** `ojizxdzbskugfuqcjlvk`
- **Project URL:** `https://ojizxdzbskugfuqcjlvk.supabase.co`
- **Key format:** Supabase's **new-format keys** — a *publishable* key (client-safe) and a *secret* key (server-only).
- **JWT signing:** project exposes an **ES256** signing key, `kid = a268e64e-313c-45c8-ac2b-a896612ef74d`. The backend verifies asymmetric tokens via JWKS, and also supports the legacy HS256 secret.

**Where secrets live (do NOT duplicate secret values in this file):**

| Value | Stored in | Env var |
|---|---|---|
| Project URL | `frontend/.env` + `backend/.env` | `VITE_SUPABASE_URL` / `SUPABASE_URL` |
| Publishable key | `frontend/.env` | `VITE_SUPABASE_ANON_KEY` |
| Secret key | `backend/.env` | `SUPABASE_SERVICE_ROLE_KEY` |
| JWT secret | `backend/.env` (set) | `SUPABASE_JWT_SECRET` (legacy HS256 fallback) |
| DB connection string | `backend/.env` (NEEDED before Level 6) | `DATABASE_URL` (use `postgresql+asyncpg://…`) |
| AI provider key | `backend/.env` (NEEDED before Level 13) | `AI_API_KEY` (+ `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`) |

Both `.env` files are gitignored. `.env.example` files document the keys with no values.

---

## 4. Development levels

Each level = one verifiable slice. Complete a level, test it, mark it done, move on.
Detailed future-level plans below are a guide and may be adjusted.

### Level 0 — Foundation (repo scaffolding) — ✅ DONE
- Repo structure `frontend/` + `backend/`, root README, `.gitignore`, `.env.example`s, `git init`, deps installed.

### Level 1 — Backend boots — ✅ DONE
- FastAPI app factory, pydantic-settings config, async SQLAlchemy engine/session, Alembic (async) + empty baseline, `GET /api/v1/health`.

### Level 2 — Frontend boots — ✅ DONE
- Vite + React + TS (strict) + Tailwind v4 + React Router + TanStack Query, app shell + dashboard/404, oxlint + Prettier + vitest.

### Level 3 — Auth (frontend) — ✅ DONE & VERIFIED
- Typed env, Supabase client, warm login page (email + password), `useSession`, `/login` route, shell sign-in/out.
- No OAuth/sign-up/forgot (user decision). Verified by user sign-in. Commit `a551f35`.

### Level 4 — Auth (backend) — ✅ DONE
- **Dual verification:** ES256/RS256 via JWKS + legacy HS256 via shared secret (chosen by token `alg`).
- **Files:** `app/core/security.py` (`get_current_user`), `app/schemas/auth.py`, `app/api/v1/auth.py` (`GET /auth/me`), router wiring, `tests/conftest.py`, `tests/test_auth.py`.
- **Evidence:** 7 tests pass (ES256 + HS256, tampered, expired, wrong issuer, no token); live JWKS fetch returns `kid a268e64e…` (EC); `/auth/me` → 401 without a token. Commit `b3d09b4`.
- **Deferred to L6:** profiles table + auto-create + `PATCH /auth/me`.

### Level 5 — App shell + protected routes
- **Goal:** real authenticated layout + navigation; block logged-out users.
- **Frontend:**
  - `features/auth/RequireAuth.tsx` — guard: while session `loading` show a spinner; if no user → redirect `/login`.
  - Restructure `app/router.tsx` into a protected branch (`RequireAuth` → `AppShell`).
  - `components/layout/Sidebar.tsx` (Dashboard, Notes, Folders, Documents, Search, Settings) + `TopBar.tsx` (search entry, user menu).
  - Mobile: sidebar becomes a drawer (Radix Dialog).
  - UI primitives: `Spinner`, `Skeleton`, `EmptyState`.
  - Dashboard becomes a light skeleton (recent items placeholders).
- **Backend:** none.
- **Acceptance:** logged-out `/` → `/login`; logged-in → shell with working nav; mobile drawer + keyboard navigation work; no layout shift on load.
- **Notes:** needs a design discussion (navigation layout) per the standing rule.
- **Risks:** auth-flash on load (mitigate with the `loading` state before redirect).

### Level 6 — Folders (backend) + profiles
- **Goal:** persist user profiles + nested folders; CRUD API. (First DB level.)
- **Prereq:** `DATABASE_URL` in `backend/.env`.
- **Backend:**
  - `profiles` model (id = auth UUID PK, email, full_name, avatar_url, timestamps); auto-create on first authenticated request.
  - `folders` model (id, user_id FK, name, `parent_id` self-FK nullable, timestamps; unique `(user_id, parent_id, name)`).
  - Alembic migration(s); `services/folders.py`; `schemas/folder.py`; `api/v1/folders.py` (tree list, create, detail, patch, delete).
  - `/auth/me` now reads the profile from the DB; add `PATCH /auth/me`.
- **Policy decisions:** deleting a folder that has children → move children to root (or require empty — decide); moving validates no cycles; names unique per parent.
- **Acceptance:** all queries scoped to `user_id`; tree listing correct; delete policy enforced; tests cover the policy.

### Level 7 — Folders (UI)
- **Goal:** full folder management in the sidebar.
- **Frontend:** folder tree; create/rename/delete/move via Radix Dialog + DropdownMenu; `hooks/useFolders.ts` (TanStack Query) with optimistic updates; empty/loading/error states.
- **Acceptance:** create/rename/delete/move folders; keyboard + screen-reader accessible; state stays consistent after mutations.

### Level 8 — Notes (backend)
- **Goal:** notes persistence + API.
- **Backend:** `notes` model (id, user_id, folder_id nullable, title, content markdown, is_pinned, timestamps); migration; `services/notes.py`; `api/v1/notes.py` (list with folder filter + pagination + text search; create/detail/patch/delete).
- **Acceptance:** notes scoped to user; pagination + filter work; tests.

### Level 9 — Notes (UI)
- **Goal:** write and manage notes.
- **Frontend:** note list; full-page editor (`features/notes/NoteEditor.tsx`); markdown textarea; debounced autosave (PATCH); delete; move to folder; pin; empty/loading/error states; keyboard-friendly.
- **Acceptance:** create/edit/delete/autosave work; no data loss on navigation/unmount.

### Level 10 — Document upload + extraction (backend)
- **Goal:** accept PDFs, store them, extract + chunk text asynchronously.
- **Backend:**
  - Models: `documents`, `document_chunks`, `jobs` + migration.
  - Supabase Storage upload (service role), bucket `documents` (create bucket).
  - `services/pdf/extractor.py` (PyMuPDF) + `chunker.py`.
  - DB-backed job runner (`services/jobs.py`) started in app lifespan; `api/v1/documents.py` (upload, list, detail, patch, delete, status).
- **Policy:** no text layer → flag `needs_ocr` (don't fail silently); record failures with message.
- **Acceptance:** upload PDF → status `ready` with extracted text + chunks; failures visible; storage access abstracted for later swaps.
- **Risks:** long extractions on free tier (jobs + polling) and scanned PDFs (no text).

### Level 11 — Documents UI
- **Goal:** upload and track documents.
- **Frontend:** drag/drop + file-picker dropzone with progress; document list with folder filter; status badges + polling (`GET /documents/{id}/status`); retry on failure.
- **Acceptance:** upload and watch status transition; errors/retry shown.

### Level 12 — PDF viewer
- **Goal:** read PDFs in-app.
- **Backend:** `GET /documents/{id}/content` → short-lived signed Storage URL.
- **Frontend:** `features/documents/PdfViewer.tsx` using `react-pdf` (pdf.js): text layer, page nav, zoom.
- **Acceptance:** PDF renders in-app with selectable text; no storage credentials ever reach the client.

### Level 13 — AI summary
- **Goal:** abstracted AI can summarize a document.
- **Prereq:** `AI_API_KEY` (+ provider/model/base URL).
- **Backend:** `ai/base.py` (`AIService` protocol + result models), `ai/providers/openai_compat.py`, `ai/providers/deepseek.py`, `ai/factory.py`, `ai/prompts.py`; `ai_generations` table; `POST /documents/{id}/summary` (job) + `GET`.
- **Frontend:** summary panel in the document workspace.
- **Acceptance:** click Summarize → stored summary shown; provider swapped via config only (no code change elsewhere).

### Level 14 — Document Q&A
- **Goal:** ask questions grounded in a document.
- **Backend:** `ai/retrieval.py` (keyword/Postgres FTS first; vectors later), `qa_messages` table, `POST /documents/{id}/ask` (job) + `GET /documents/{id}/qa` (history).
- **Frontend:** Q&A chat panel with history.
- **Acceptance:** answers grounded in the user's document; history persists; retrieval scoped to the selected document + user.

### Level 15 — Global search
- **Goal:** search notes + document text in one place.
- **Backend:** unified `GET /search` over notes + extracted document text (Postgres FTS + trigram), ranked results with snippets.
- **Frontend:** `features/search/SearchPage.tsx` + command palette (⌘K) entry in the TopBar.
- **Acceptance:** search returns notes and documents with match highlighting.

### Level 16 — Flashcards & quizzes
- **Goal:** generate study material from documents.
- **Backend:** structured (JSON) generation with Pydantic validation + single repair retry; store in `ai_generations` jsonb; `POST /documents/{id}/flashcards`, `POST /documents/{id}/quiz`.
- **Frontend:** flashcard study view + quiz view.
- **Acceptance:** generate and study; malformed model output never stored as success.

### Level 17 — Hardening + deploy
- **Goal:** production-ready + live.
- **Work:** test depth, accessibility audit, error boundaries, pagination, optimistic updates, structured logging/observability, security review (RLS as defense-in-depth).
- **Deploy:** frontend (Vercel/Netlify), backend (Render free), Supabase config; env vars; CORS allowlist; cold-start handled via job + polling.
- **Acceptance:** live on a custom domain with green checks.

---

## 5. Next Up — Level 5 (App shell + protected routes)

**Goal:** a real authenticated layout with navigation; logged-out users are redirected to `/login`. **Frontend only — no backend changes.**

**Files to create/change (frontend):**
- `features/auth/RequireAuth.tsx` — guard: while `useSession().loading` show a spinner; if no user → redirect to `/login`.
- `app/router.tsx` — wrap app routes in `RequireAuth` → `AppShell`; keep `/login` public.
- `components/layout/Sidebar.tsx` — nav (Dashboard, Notes, Folders, Documents, Search, Settings).
- `components/layout/TopBar.tsx` — search entry + user menu (email, sign out).
- Mobile: sidebar becomes a drawer (Radix Dialog).
- UI primitives: `Spinner`, `Skeleton`, `EmptyState`.
- Dashboard: replace placeholder with a light "recent items" skeleton.

**Design discussion required first** (nav layout, sidebar behaviour) per the standing rule.

**Acceptance:** logged-out `/` → `/login`; logged-in → shell with working nav; mobile drawer + keyboard navigation work; no auth flash on load.

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

### 2026-10-08 — Implementation session (Levels 0–2) ✅
- **Level 0 done:** monorepo scaffold, `.gitignore`, root README, `.env.example`s, `git init`, commit `27101e8`.
- **Level 1 done:** FastAPI app factory, settings, async engine/session, Alembic baseline `7b960e020541`, `/api/v1/health`.
- **Level 2 done:** Vite 8 + React 19 + TS 6 (strict) + Tailwind v4 + React Router 8 + TanStack Query 5; shell + dashboard/404; vitest.
- **Evidence:** pytest `1 passed`, ruff clean, health 200; typecheck clean, oxlint 0 errors, vitest `1 passed`, build ok.
- **Versions:** FastAPI 0.143.0, SQLAlchemy 2.1.4, Alembic 1.20.0, Pydantic 2.14.0, uvicorn 0.54.0, pytest 9.1.1; React 19.2, Vite 8.3, TS 6.0, Tailwind 4.3, React Router 8.4, TanStack Query 5.104, Vitest 5.0.3.
- **Deviations:** template shipped **oxlint** (kept; added Prettier); TS 6 deprecates `baseUrl` (uses `paths` only).

### 2026-10-08 — Supabase setup + documentation session
- Supabase project created: ref `ojizxdzbskugfuqcjlvk`, URL `https://ojizxdzbskugfuqcjlvk.supabase.co`; new-format publishable + secret keys provided.
- Mapped: publishable → `VITE_SUPABASE_ANON_KEY`; secret → `SUPABASE_SERVICE_ROLE_KEY` (server-only).
- Still to collect: `SUPABASE_JWT_SECRET` (L4), `DATABASE_URL` (L6), `AI_API_KEY` (L13).

### 2026-10-08 — Level 3 implementation (Auth, frontend) ✅
- Design: warm paper/books; user sketch → email + password only ("Welcome").
- Created: `frontend/.env`, `src/vite-env.d.ts`, `src/config/env.ts`, `src/lib/supabase.ts`, `src/lib/cn.ts`, `src/components/ui/{Button,Input,PasswordInput,icons.tsx}`, `src/features/auth/{useSession.ts,LoginPage.tsx,LoginPage.test.tsx}`.
- Changed: `index.html` (Noto fonts), `src/index.css` (warm `@theme`), `src/app/router.tsx` (`/login`), `AppShell` (auth-aware header), `DashboardPage` (re-themed).
- Evidence: typecheck clean · oxlint 0 · vitest `4 passed` · build ok · `/login` 200. Commit `a551f35`.

### 2026-10-08 — Level 3 verified + in-repo progress doc + future-level plans
- User created a Supabase user and **signed in successfully** → Level 3 verified end-to-end.
- Added in-repo progress doc `docs/PROGRESS.md` (commit `299928e`), linked from README; both copies kept in sync.
- Expanded **Levels 5–17** with goals/files/acceptance, and added appendices **§9 API surface** + **§10 database schema**.
- **Status:** ready for Level 4; still need `SUPABASE_JWT_SECRET`.

### 2026-10-09 — Level 4 implementation (Auth, backend) ✅
- Project exposes an **ES256** signing key (`kid a268e64e…`) **and** a legacy HS256 secret → implemented **dual JWT verification** (chosen by token `alg`).
- **Added:** `PyJWT[crypto]`; `app/core/security.py` (`get_current_user`); `app/schemas/auth.py`; `app/api/v1/auth.py` (`GET /auth/me`); `config` properties `supabase_issuer` / `supabase_jwks_url`; `tests/conftest.py`.
- **Changed:** `app/api/v1/router.py` (mount auth); `pyproject.toml` (ruff excludes `alembic/versions`); `backend/.env` created (gitignored); `.env.example` comment.
- **Evidence:** 7 tests pass (ES256 + HS256, tampered, expired, wrong issuer, no token); live JWKS fetch returns the real EC key; server boots with real env, `/health` 200, `/auth/me` 401 without token. Commit `b3d09b4`.
- **Status:** Level 4 done; ready for Level 5 (app shell + protected routes). Next value needed: `DATABASE_URL` (Level 6).

---

## 7. Current state / next action

- **Where we are:** Levels 0–4 complete. Commits: `27101e8`, `a551f35`, `299928e`, `c6d9b49`, `b3d09b4`.
- **Backend:** boots with real `backend/.env`; `/api/v1/health` → 200; `/api/v1/auth/me` verifies JWTs (ES256 via JWKS + HS256 via secret); 7 tests pass; venv at `backend/.venv`.
- **Frontend:** email + password sign-in works end-to-end (verified earlier); dev server was killed by an environment restart — restart with `npm run dev`.
- **Next action:** implement **Level 5 — App shell + protected routes** (§5). A **design discussion is required first**.
- **Do not forget:** end each session by appending to §6 and updating §5/§7/§4 in BOTH mirrored files.

---

## 8. Open items / TODOs

1. **Git identity placeholder** — amend `27101e8` once real name/email is provided.
2. **Collect `DATABASE_URL`** (URI + connection pooler + DB password) — required before Level 6 (first table).
3. **Create Supabase Storage bucket `documents`** — required before Level 10.
4. **Collect `AI_API_KEY`** (DeepSeek or other) — required before Level 13.
5. **Supabase Auth redirect URLs** — allow-list `http://localhost:5173` (for future email flows).
6. **Keep docs in sync** — `docs/PROGRESS.md` ↔ `C:\Users\tawfi\.opencode\plan\project-plan-and-progress.md`.
7. **`backend/.env`** — created at Level 4 (gitignored).

---

## 9. Appendix — planned API surface (v1, under `/api/v1`)

| Area | Method + path | Level |
|---|---|---|
| Auth | `GET /auth/me`, `PATCH /auth/me` | 4 / 6 |
| Folders | `GET /folders` (tree), `POST /folders`, `GET /folders/{id}`, `PATCH /folders/{id}`, `DELETE /folders/{id}` | 6 |
| Notes | `GET /notes` (filter + page), `POST /notes`, `GET /notes/{id}`, `PATCH /notes/{id}`, `DELETE /notes/{id}` | 8 |
| Documents | `GET /documents`, `POST /documents`, `GET /documents/{id}`, `PATCH /documents/{id}`, `DELETE /documents/{id}`, `GET /documents/{id}/content`, `GET /documents/{id}/status` | 10–12 |
| AI | `POST|GET /documents/{id}/summary`, `POST /documents/{id}/ask`, `GET /documents/{id}/qa`, `POST /documents/{id}/flashcards`, `POST /documents/{id}/quiz` | 13–16 |
| Search | `GET /search` | 15 |
| Health | `GET /health` | 1 |

Conventions: JSON, list responses paginated (`{ items, total, page, page_size }`), mutations return the updated object, all routes require a verified Supabase JWT (except `/health` and `/auth/me` may accept the token directly).

---

## 10. Appendix — planned database schema

Tables (all `uuid` PKs; `user_id` on every tenant-owned table; timestamps everywhere):

- **profiles** — id (= auth user UUID, PK), email, full_name, avatar_url, created_at, updated_at.
- **folders** — id, user_id FK, name, parent_id (self-FK, nullable), created_at, updated_at; unique `(user_id, parent_id, name)`.
- **notes** — id, user_id FK, folder_id FK nullable, title, content (markdown), is_pinned, created_at, updated_at.
- **documents** — id, user_id FK, folder_id FK nullable, title, file_name, storage_path, mime_type, file_size_bytes, page_count, processing_status (`uploaded|extracting|needs_ocr|ready|failed`), text_content, error_message, created_at, updated_at.
- **document_chunks** — id, document_id FK, chunk_index, content, token_count, embedding `vector(1536)` nullable (pgvector, added at Level 14).
- **jobs** — id, user_id FK, type, status (`queued|running|succeeded|failed`), payload jsonb, result jsonb, error, created_at, updated_at.
- **ai_generations** — id, user_id FK, document_id FK nullable, note_id FK nullable, kind (`summary|qa|flashcards|quiz`), prompt, result jsonb, provider, model, status, error_message, tokens_used, created_at, updated_at.
- **qa_messages** — id, generation_id FK, role (`user|assistant`), content, created_at.

Indexes: `notes(user_id, folder_id)`, `documents(user_id, folder_id)`, `document_chunks(document_id)`, plus FTS/trigram indexes at Level 15.

Migrations are managed by Alembic (`backend/alembic/versions/`). The initial baseline is empty; real tables arrive from Level 6 onward.

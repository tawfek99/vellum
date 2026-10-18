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

**Commits so far:** `27101e8` (L0–2) · `a551f35` (L3) · `b3d09b4` (L4) · `34ff9f0` (L5) · `23a1464`, `0a149fa` (L6) · `4c47f71`, `60dfb45`, `bed4320`, `176dbea` (L7) · `136cb75` (L8) · `aff98cf`, `774202f` (L9) · docs: several `docs:` commits.

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
| 10 | App-shell layout adapted from user's "Libretto" reference | ✅ Confirmed | Sidebar + topbar + dashboard; **no AI panel on dashboard** (goes in document workspace, L13); keep terracotta accent |
| 11 | Folder delete policy: children move up to the parent | ✅ Confirmed | No cascade delete; app-level duplicate-name check (409) + DB unique on (user_id, parent_id, name) |
| 12 | Notes backend: page_size 50 envelope, pinned-first, folder-delete unfiles notes | ✅ Confirmed | ILIKE search (FTS later at L15); blank title → "Untitled" |
| 13 | Drag-and-drop (`@dnd-kit`): drag folders to re-nest, drag notes to file | ✅ Implemented | Keyboard sensor enabled; "Move to…" picker kept as accessible fallback |
| 14 | Notes UI redesign: paper-card grid + split workspace | ✅ Confirmed | Inspired by user's torn-paper reference; adapted (soft shadows, not literal torn edges) |
| 15 | Editor: TipTap WYSIWYG (markdown) + Lora serif, bookmark overflow menu, "Saved to notebook" stamp | ✅ Confirmed | Editor lazily code-split; folder cards show `note_count` |
| 16 | Documents UI: paper cards + upload dropzone + status badges + polling | ✅ Confirmed | Scanned PDFs shown as "Scanned PDF" (OCR deferred); PDF viewer at L12 |
| 17 | Auth: JWT verification leeway (30s) + JWKS warm-up | ✅ Implemented | Fixes intermittent 401 from PyJWT `iat` clock skew |
| 18 | PDF viewer: react-pdf continuous scroll + page/zoom controls | ✅ Confirmed | Signed URL only; no storage creds in the client; lazily loaded |
| 19 | AI provider: Gemini free tier via OpenAI-compatible endpoint | ✅ Confirmed | `gemini-3.8-flash`; summary = paragraph + page-cited key points |

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
| DB connection string | `backend/.env` (set — Supabase transaction pooler, port 6543) | `DATABASE_URL` (`postgresql+asyncpg://…?ssl=require`) |
| AI provider key | `backend/.env` (NEEDED before Level 13) | `AI_API_KEY` (+ `AI_PROVIDER`, `AI_MODEL`, `AI_BASE_URL`) |

Both `.env` files are gitignored. `.env.example` files document the keys with no values.

> **Pooler note:** the connection uses Supabase's **transaction pooler** (pgbouncer), which does not support server-side prepared statements. Both the app engine (`app/db/session.py`) and Alembic (`alembic/env.py`) set `statement_cache_size=0` + `prepared_statement_cache_size=0`. The URL also carries `?ssl=require`.

> **AI provider:** **Gemini free tier** via `https://generativelanguage.googleapis.com/v1beta/openai`, model `gemini-3.8-flash`. Key lives in `backend/.env` as `AI_API_KEY` (never committed); swap providers via `AI_PROVIDER` / `AI_BASE_URL` / `AI_MODEL`.

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

### Level 5 — App shell + protected routes — ✅ DONE
- **Delivered:** `RequireAuth` guard (spinner → redirect); `AppShell` (fixed sidebar + scrollable main); `SidebarContent` + `Sidebar` + `MobileNav` (Radix Dialog drawer); `TopBar` (search placeholder, disabled "New", `UserMenu` with sign out); revamped dashboard (greeting + empty states); Notes/Documents/Settings placeholder pages; primitives `Spinner`/`Skeleton`/`EmptyState`/`Avatar`; `lib/user.ts`.
- **Deps added:** `lucide-react`, `@radix-ui/react-dialog`, `@radix-ui/react-dropdown-menu`.
- **Evidence:** typecheck clean · oxlint 0 · vitest `8 passed` · build ok. Commit `34ff9f0`.
- **Deferred:** folders in the sidebar (L7); real search (L15); the "New" action (L8–L11).

### Level 6 — Folders (backend) + profiles — ✅ DONE & APPLIED
- **Delivered:** `Profile` + `Folder` models (self-referential parent; unique `(user_id, parent_id, name)`); migration `fd6dea48a435`; `get_current_profile` (auto-create on first request); `/auth/me` GET + PATCH now persisted; folders service + `/folders` CRUD (rename/move with cycle + duplicate checks; delete re-parents children **up**); domain errors mapped to 4xx; `TimestampMixin`.
- **Deps:** `aiosqlite` (dev only, for offline tests).
- **Applied:** `alembic upgrade head` run against Supabase — `profiles` + `folders` exist (version `fd6dea48a435`).
- **Pooler fix:** transaction pooler (pgbouncer) can't use prepared statements → engine + alembic now set `statement_cache_size=0` + `prepared_statement_cache_size=0`.
- **Evidence:** 14 tests pass · ruff clean · **live end-to-end check** (real Supabase user → token → `/auth/me` 200 → create/list folder) passed.
- **Commits:** `23a1464`, `0a149fa`.

### Level 7 — Folders UI — ✅ DONE
- **Delivered:** token-aware `lib/api/client.ts`; `features/folders/{api,tree}.ts`; `hooks/useFolders.ts` (optimistic create/rename/move/delete); interactive `components/folders/FolderTree.tsx` (nested, expand/collapse, inline create/rename, per-folder menu: new subfolder / rename / move to… / delete) + `InlineNameInput`; `ui/Modal` + `danger` Button variant; tree wired into the sidebar.
- **Evidence:** typecheck clean · oxlint 0 · vitest `15 passed` (7 files) · build ok. Commit `4c47f71`.
- **Deferred:** folder navigation into contents (L9+); drag-and-drop (not chosen).

### Level 8 — Notes (backend) — ✅ DONE & APPLIED
- **Delivered:** `Note` model (title, markdown content, `is_pinned`, `folder_id` FK `ON DELETE SET NULL`); migration `263560731a3f`; `services/notes.py`; `schemas/note.py`; `api/v1/notes.py` (list w/ folder filter + search + pagination, create, detail, patch, delete).
- **Decisions:** `page_size` default 50 with `{items,total,page,page_size}`; pinned-first then `updated_at desc`; deleting a folder **unfiles** its notes; case-insensitive `ILIKE` search; blank title → "Untitled".
- **Evidence:** 24 backend tests pass · ruff clean · live e2e (create / move+pin / filter / search / delete) against Supabase. Commit `136cb75`.

### Level 9 — Notes UI — ✅ DONE (+ redesigned)
- **Base:** `features/notes/{api,NotesPanel,NotesWorkspace,NoteEditorPage,NoteCard}`; `hooks/useNotes.ts`; `types/note.ts`; helpers `lib/date.ts`, `lib/mergeRefs.ts`, `hooks/useDebouncedValue.ts`.
- **Redesign (user feedback):** notes **grid of paper cards** (folder/date pills, overflow menu, soft shadows); **split workspace** (grid + editor pane; mobile swaps to editor); **journal editor** (Lora serif title, **TipTap WYSIWYG** markdown, bookmark **overflow menu** for pin/move/delete, **Copy link**, **"Saved to notebook ✓"** stamp, debounced autosave); **dashboard desk cards** (recent notes + folder cards with counts).
- **Backend:** folders list returns `note_count`.
- **Drag & drop (`@dnd-kit`):** folders re-nest, notes file into folders; animated overlay; "Move to…" picker kept.
- **Evidence:** typecheck clean · oxlint 0 · vitest `26 passed` · backend `25 passed` · build ok (editor code-split). Commits `aff98cf`, `774202f`.

### Level 10 — Document upload + extraction (backend) — ✅ DONE & APPLIED
- **Delivered:** `documents` / `document_chunks` / `jobs` models + migration `6447368fa155`; `services/storage.py` (Supabase Storage: upload / download / signed URL / delete); `services/pdf/{extractor,chunker}.py`; DB-backed job queue + in-process worker (started in the app lifespan); `/documents` API (multipart upload, list, detail, patch, delete, status, content URL).
- **Storage:** private bucket `documents` created (programmatically). Scanned PDFs (no text layer) are flagged `needs_ocr`.
- **Evidence:** 37 backend tests pass · ruff clean · migration applied · **live e2e** (upload → storage → worker extraction → `ready` 2 pages → signed URL → delete) passed.
- **Deps:** `PyMuPDF`, `python-multipart`, `httpx` (runtime). Commit `5ad6058`.

### Level 11 — Documents UI — ✅ DONE
- **Delivered:** `features/documents/{api,DocumentStatusBadge,DocumentCard,DocumentsPage}`; `hooks/useDocuments.ts`; `types/document.ts`; `lib/format.ts`; reusable `components/folders/FolderPickerDialog.tsx`.
- **UX:** Upload button + **drag-and-drop** (drop overlay); torn-paper document cards with a **status badge** (Processing / Ready / **Scanned PDF** / Failed) and a menu (rename / move / delete); auto-**polling** while processing.
- **Evidence:** typecheck clean · oxlint 0 · vitest `31 passed` · build ok. Commit `1357468`.

### Level 12 — PDF viewer — ✅ DONE
- **Delivered:** `/documents/:id` (`features/documents/DocumentViewPage.tsx`) using **react-pdf (pdf.js)**; `lib/pdf.ts` (worker via Vite `?url`); `useDocumentContent` hook; signed URL from `GET /documents/{id}/content`.
- **UX:** **fit-to-width** continuous-scroll reader (re-fits on resize), **floating page/zoom toolbar**, selectable text layer, and a **full-screen overlay**; banners for `needs_ocr` / `failed` / processing; document cards link to the viewer.
- **Evidence:** typecheck clean · oxlint 0 · vitest `35 passed` · build ok · signed URL verified live (200, `application/pdf`). Commits `45d7395`, `65ccfb0`.

### Level 13 — AI summary — ✅ DONE
- **Delivered:** `ai/base.py` (`AIService` protocol + `SummaryResult`/`KeyPoint`), `ai/providers/openai_compat.py`, `ai/factory.py`, `ai/prompts.py`; `ai_generations` model + migration `5a092d87c56e`; `services/summaries.py`; `POST/GET /documents/{id}/summary`.
- **Provider:** **Gemini** (free tier) via its OpenAI-compatible endpoint (`gemini-3.8-flash`); provider chosen by config only.
- **Page citations:** extraction now stores `[[page N]]` markers; the model cites pages per key point.
- **Frontend:** `SummaryPanel` — the PDF narrows and the panel gets comfortable space; key points link to their page (jumps the viewer).
- **Evidence:** 43 backend + 35 frontend tests · ruff/oxlint clean · build ok · **live Gemini summary verified** (correct page refs 1/2/3). Commit `d40ef5b`.

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

## 5. Next Up — Level 14 (Document Q&A)

**Goal:** ask questions grounded in a document, with conversation history.

**Backend:**
- `ai/retrieval.py` — retrieve relevant chunks for a question (keyword/Postgres FTS first; pgvector embeddings later).
- `qa_messages` table (role, content) + migration.
- `POST /documents/{id}/ask` (job: retrieve chunks → `AIService.answer_question`) + `GET /documents/{id}/qa` (history).
- Extend `AIService` with `answer_question(question, context, history)`.

**Frontend:**
- A **Q&A panel** in the document view (alongside/switchable with Summary): ask box, message history, loading/error states, source page citations.

**Acceptance:** ask a question about a `ready` document and get a grounded answer with history; retrieval scoped to the user's document.

### Design system (locked for the app)
- **Direction:** warm, paper/books. Cream background, parchment surfaces, warm-brown "ink" text, terracotta ("clay") accent; sage/ochre for status. Tokens in `src/index.css` under `@theme`.
- **Fonts:** Lora (display/headings) + Noto Sans (body/UI), via Google Fonts in `index.html`.
- **Paper cards:** `.paper` / `.paper__bg` / `.paper__content` (SVG `#paper-rough` filter + grain + tilt).
- **Reusable primitives:** `Button`, `Input`, `PasswordInput`, `Modal`, `Spinner`, `Skeleton`, `EmptyState`, `Avatar`, `FolderPickerDialog` + `cn()`.

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

### 2026-10-10 — Level 5 implementation (App shell + protected routes) ✅
- **Design:** adopted the user's "Libretto" reference, adapted to our warm theme. Decisions: **no AI panel on the dashboard** (deferred to the document workspace, L13); **keep terracotta** accent; nav = Dashboard / Notes / Documents / My Library / Settings.
- **Deps added:** `lucide-react` (line icons), `@radix-ui/react-dialog` (mobile drawer), `@radix-ui/react-dropdown-menu` (profile menu).
- **Added:** `features/auth/RequireAuth.tsx`; `components/layout/{AppShell,Sidebar,SidebarContent,MobileNav,TopBar,UserMenu}.tsx`; `components/ui/{Spinner,Skeleton,EmptyState,Avatar}.tsx`; `lib/user.ts`; pages for Notes/Documents/Settings; tests `RequireAuth.test.tsx` + `SidebarContent.test.tsx`.
- **Changed:** `app/router.tsx` (RequireAuth branch), `AppShell.tsx` (rewrite), `DashboardPage.tsx` (+ test), `index.css` (drawer keyframes).
- **Evidence:** typecheck clean · oxlint 0 · vitest `8 passed` (4 files) · build ok. Commit `34ff9f0`.
- **Known:** prod JS chunk ~664 kB (Radix + lucide); code-split later.
- **Status:** Level 5 done; ready for Level 6 once `DATABASE_URL` is available.

### 2026-10-11 — Level 6 implementation (profiles + folders backend) ✅ (migration pending apply)
- **Built:** `Profile` + `Folder` models (self-referential parent); `TimestampMixin`; migration `fd6dea48a435`; `get_current_profile` (auto-create); `/auth/me` now persisted (GET + PATCH); folders service + `/folders` CRUD; `DomainError` → 4xx handler; `aiosqlite` dev dep.
- **Decisions:** folder delete moves children **up** to the parent; app-level duplicate-name check (409); move rejects cycles.
- **Tests:** in-memory SQLite suite (`conftest.py` override) + `test_folders.py` + updated `test_auth.py` → **14 passed**. Migration validated by applying to a throwaway SQLite DB.
- **Evidence:** ruff clean · 14 tests · API surface `/api/v1/folders` · backend restarted with the new routes.
- **Commit:** `23a1464`.

### 2026-10-11 — Level 6 migration applied to Supabase + live verification ✅
- Received `DATABASE_URL` (transaction pooler, `eu-west-1`) + DB password; set in `backend/.env` with `?ssl=require`.
- First `alembic upgrade head` hit the asyncpg/pgbouncer **prepared-statement** error → disabled the statement cache in `app/db/session.py` and `alembic/env.py` (`statement_cache_size=0`, `prepared_statement_cache_size=0`).
- Migration applied: `profiles` + `folders` exist in Supabase (alembic version `fd6dea48a435`), verified via `pg_tables` + `information_schema`.
- **Live end-to-end check** (temporary Supabase user created via Admin API + password sign-in, then removed): `GET /auth/me` → 200 (profile auto-created); `POST /folders` → 201; `GET /folders` → 200; cleanup 200.
- Backend restarted with the Supabase DB config.
- **Commit:** `0a149fa`. **Status:** Level 6 fully done and live; ready for Level 7 (Folders UI).

### 2026-10-11 — Level 7 implementation (Folders UI) ✅
- Built the interactive sidebar folder tree (chosen defaults: inline create/rename, "⋯" menu, move picker, delete confirm, optimistic updates).
- **Added:** `lib/api/client.ts`; `features/folders/{api,tree}.ts`; `hooks/useFolders.ts`; `components/folders/{FolderTree,InlineNameInput}.tsx`; `components/ui/Modal.tsx`; jsdom polyfills in `test/setup.ts`; tests `tree.test.ts`, `client.test.ts`, `FolderTree.test.tsx`.
- **Changed:** `components/layout/SidebarContent.tsx` (renders the tree), `components/ui/Button.tsx` (`danger` variant), `SidebarContent.test.tsx` (mocks the tree).
- **Evidence:** typecheck clean · oxlint 0 · vitest `15 passed` (7 files) · build ok. Commit `4c47f71`.
- **Status:** Level 7 done; ready for Level 8 (Notes backend).

### 2026-10-11 — Level 7 polish (user feedback) ✅
- **Reported:** (a) the "＋" felt hidden, (b) clicking **Rename** cleared the input to the placeholder.
- **Fixed:** `InlineNameInput` now defers focus until after the menu closes and won't resubmit an unchanged name; the folder menu uses `onCloseAutoFocus` preventDefault so the rename input keeps focus; the "＋" is now prominent (clay color + tooltip).
- **Root cause found (important):** the project lives on a **OneDrive** drive, so Vite's native file watching was unreliable and the dev server **served stale code**. Fixed by restarting it and permanently by setting `server.watch.usePolling = true` in `vite.config.ts`.
- **Tests:** 19 passing. **Commit:** `60dfb45`.

### 2026-10-11 — Level 7 UX follow-up
- Per user: the "＋" should **not** be always visible. Removed the header ＋ and added a **"New folder"** action row **inside** the expanded "My Library" section. The section stays **collapsed by default** (no auto-open on refresh).
- **Commit:** `176dbea`.

### 2026-10-12 — Level 8 implementation (Notes backend) ✅
- Built the notes backend: model, migration, service, API, tests.
- **Decisions:** `page_size` 50 envelope; pinned-first ordering; folder delete unfiles notes; ILIKE search; blank title → "Untitled".
- **Added:** `models/note.py`, `schemas/note.py`, `services/notes.py`, `api/v1/notes.py`, migration `263560731a3f`, `tests/test_notes.py`.
- **Changed:** `models/__init__.py`, `api/v1/router.py`.
- **Evidence:** 24 backend tests pass · ruff clean · migration applied to Supabase · live e2e (create / move+pin / filter / search / delete) passed; servers restarted.
- **Commit:** `136cb75`. **Status:** Level 8 done; ready for Level 9 (Notes UI).

### 2026-10-12 — Level 9 implementation (Notes UI + drag and drop) ✅
- Built the notes UI and app-wide drag-and-drop (chosen: full-page editor).
- **Added:** `types/note.ts`, `features/notes/{api,NoteListItem,NotesPage,NoteEditorPage}`, `hooks/{useNotes,useDebouncedValue}`, `lib/{date,mergeRefs}`, `features/dnd/{context,AppDndProvider}`; tests for NotesPage + NoteEditorPage.
- **Changed:** `FolderTree.tsx` (DnD + navigate on folder click), `AppShell.tsx` (wrap in AppDndProvider), `router.tsx` (`/notes/:id`), `DashboardPage.tsx` (recent notes).
- **Deps:** `@dnd-kit/core`.
- **Evidence:** typecheck clean · oxlint 0 · vitest `26 passed` · build ok. Commit `aff98cf`.
- **Status:** Level 9 done; ready for Level 10 (Documents backend).

### 2026-10-13 — Level 9 redesign (paper cards + WYSIWYG editor) ✅
- User supplied a torn-paper card reference and chose: WYSIWYG (TipTap), Lora serif, folder `note_count`, "Copy link".
- **Frontend:** new `NoteCard` (paper card: folder/date pills, overflow menu); `NotesPanel` (card grid); `NotesWorkspace` (split; mobile swaps to editor); redesigned `NoteEditorPage` (Lora title, TipTap WYSIWYG, bookmark overflow menu, Copy link, "Saved to notebook ✓" stamp); `RichTextEditor` (TipTap + `tiptap-markdown`); dashboard desk cards.
- **Backend:** `FolderRead.note_count` + `count_notes_by_folder`.
- **Deps:** `@tiptap/*`, `tiptap-markdown`; Lora font. Editor lazily code-split (own chunk).
- **Changed:** `AppShell` (flex layout), `router.tsx` (lazy editor route), `index.css` (editor typography), `types/folder.ts`, dashboard/documents/settings pages, DnD overlay animation.
- **Evidence:** typecheck clean · oxlint 0 · vitest `26 passed` · backend `25 passed` · build ok. Commit `774202f`.
- **Status:** Level 9 redesigned; ready for Level 10 (Documents backend).

### 2026-10-13 — Level 9 design pass (user feedback) ✅
- Editor now opens **full-page** again (removed the split workspace), per user.
- **Torn-paper cards:** SVG `feDisplacementMap` rough/deckled edges + paper grain + deterministic subtle tilt (+ dashboard folder cards).
- **DnD smoothness:** drag overlay snaps to the cursor grab point; the target folder **pulses** on drop as confirmation.
- **Motion:** all dropdowns animate in (fade/scale), folder-tree expand animates, modals animate in; `prefers-reduced-motion` respected.
- **Evidence:** typecheck clean · oxlint 0 · vitest `26 passed` · build ok. Commit `e754a98`.

### 2026-10-14 — Level 10 implementation (Documents backend) ✅
- Created the private Supabase **Storage bucket `documents`** (programmatically via the Storage API).
- Built document models + migration, storage service, PyMuPDF extraction + chunker, DB-backed job queue + in-process worker, and the `/documents` API.
- **Deps:** `PyMuPDF`, `python-multipart`, `httpx` (runtime).
- **Evidence:** 37 backend tests · ruff clean · migration applied · live e2e (upload → extraction → `ready` 2 pages → signed URL → delete) passed.
- **Commit:** `5ad6058`. **Status:** Level 10 done; ready for Level 11 (Documents UI).

### 2026-10-14 — Level 11 implementation (Documents UI) ✅
- Built the documents UI matching the established paper look: upload button + **drag-and-drop** dropzone (drop overlay), torn-paper document cards.
- **Status badges:** Processing / Ready / **Scanned PDF** (`needs_ocr`) / Failed; auto-**polling** while processing.
- **Added:** `types/document.ts`, `features/documents/{api,DocumentStatusBadge,DocumentCard,DocumentsPage}`, `hooks/useDocuments.ts`, `lib/format.ts`, `components/folders/FolderPickerDialog.tsx`; sage/ochre status colors; multipart support in the API client.
- **Also:** found + fixed an intermittent auth 401 (PyJWT `iat` clock skew → 30s leeway + JWKS warm-up) — commit `e49dd2d`.
- **Evidence:** typecheck clean · oxlint 0 · vitest `31 passed` · build ok. Commit `1357468`.
- **Status:** Level 11 done; ready for Level 12 (PDF viewer).

### 2026-10-18 — Level 12 implementation (PDF viewer) ✅
- Built the in-app PDF reader at `/documents/:id` with **react-pdf (pdf.js)**.
- **UX:** continuous scroll, prev/next + live page indicator, zoom, selectable text; banners for `needs_ocr` / `failed` / processing; document cards link into it.
- **Added:** `lib/pdf.ts` (worker), `features/documents/DocumentViewPage.tsx`, `useDocumentContent`, `getDocumentContent`; viewer CSS; lazy route.
- **Evidence:** typecheck clean · oxlint 0 · vitest `35 passed` · build ok · signed URL verified live (200, `application/pdf`, valid bytes).
- **Commit:** `45d7395`. **Status:** Level 12 done; ready for Level 13 (AI summary).

### 2026-10-18 — PDF viewer polish (fit-to-width + full screen)
- Per user feedback (too little reading space): the reader now **fits the page to the available width** (re-fits on resize), with zoom relative to fit; page/zoom controls moved into a **floating pill**; added a **full-screen overlay** (hides sidebar/top bar); the document route uses the **full content width**.
- **Evidence:** typecheck clean · oxlint 0 · vitest `35 passed` · build ok. Commit `65ccfb0`.
- **Follow-up fix:** the full-screen content wrapper is now a flex column, so the reader fills the viewport and its **scrolling + zoom work**; removed the redundant "fit to width" button. Commit `923d620`.

### 2026-10-18 — Level 13 implementation (AI summary) ✅
- Added the provider-agnostic AI layer: **Gemini free tier** via its OpenAI-compatible endpoint (`gemini-3.8-flash`).
- **Backend:** `AIService` protocol + OpenAI-compatible provider + factory + prompts; `ai_generations` model/migration; async summarize job; `POST/GET /documents/{id}/summary`.
- **Page citations:** extraction now stores `[[page N]]` markers; summaries include page-referenced key points.
- **Frontend:** `SummaryPanel` — the PDF narrows and the panel gets comfortable space; key points jump to their page.
- **Evidence:** 43 backend + 35 frontend tests · ruff/oxlint clean · **live Gemini summary verified** (correct page refs 1/2/3). Commit `d40ef5b`.
- **Status:** Level 13 done; ready for Level 14 (Q&A).

### 2026-10-18 — Summary UX follow-up
- The 400 the user saw was correct: they summarized a **scanned** PDF (`needs_ocr`, 0 text). The UI was swallowing the error.
- **Fixed:** panel now explains why summarization isn't available (scanned / extracting / failed), surfaces unexpected request errors, shows an animated "reading the document" progress state, and is **wider (480px)** with **slide-in + fade-in** transitions when the summary arrives.
- **Commit:** `1153aef`.

### 2026-10-18 — PDF viewer stability fix
- Fixed "heavy glitching" on open: **deduped ResizeObserver** width updates (rounded + 2px tolerance), **rounded page width**, **gate page rendering until the width is measured**, **memoized page elements** (scroll/page state no longer re-renders canvases), and only update the page indicator when it changes.
- **Commit:** `3f49849`.
- **Deeper fix:** a new document still glitched (1 page, 258 KB — not a page-count issue), so I removed the `ResizeObserver` entirely (measure once + window resize / summary-panel toggle), capped the rendered page width at **1200px** to bound canvas memory, and rAF-throttled scroll tracking. Commit `82d4fe5`.

---

## 7. Current state / next action

- **Where we are:** Levels 0–13 complete. Commits through `1153aef`.
- **Backend:** running on `:8000` against Supabase; `/health`, `/auth/me`, `/folders`, `/notes`, `/documents` (+ summaries), background job worker; **43 tests pass**.
- **Frontend:** running on `:5173`; shell + folders + torn-paper notes + WYSIWYG editor + documents UI + fit-to-width PDF reader + **AI summary panel**; **35 tests pass**.
- **Next action:** implement **Level 14 — Document Q&A** (§5).
- **Do not forget:** end each session by appending to §6 and updating §5/§7/§4 in BOTH mirrored files.

---

## 8. Open items / TODOs

1. **Git identity placeholder** — amend `27101e8` once real name/email is provided.
2. **Collect `AI_API_KEY`** (DeepSeek or other) — required before Level 13.
3. **Supabase Auth redirect URLs** — allow-list `http://localhost:5173` (for future email flows).
4. **Keep docs in sync** — `docs/PROGRESS.md` ↔ `C:\Users\tawfi\.opencode\plan\project-plan-and-progress.md`.
5. **`backend/.env`** — set (Supabase pooler + keys), gitignored.
6. **Storage bucket `documents`** — created (private).
7. **Note:** DB password + secrets are in `backend/.env` only; never commit.

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

# Dayfold

A project management app with **Asana's structure** and **Notion's soul** — every task
opens into a rich block-editor page, and a full nested-pages Notes app lives alongside the
projects. Two apps in one, sharing one editor engine, real-time from day one.

> **Stack note:** Dayfold is written in **plain JavaScript (ESM)**, not TypeScript.

---

## Tech stack

| Layer            | Choice                                         |
| ---------------- | ---------------------------------------------- |
| Framework        | Next.js 15 (App Router), JavaScript/JSX        |
| Styling          | Tailwind CSS + shadcn/ui (dark-first)          |
| Database         | PostgreSQL 16 (Docker)                         |
| ORM / migrations | Drizzle ORM + drizzle-kit                      |
| Auth             | Better Auth (email/password + optional Google) |
| Editor           | Tiptap (ProseMirror)                           |
| Realtime         | Yjs + Hocuspocus (standalone Node service)     |
| Data/state       | TanStack Query + server actions                |
| Validation       | Zod on every API boundary                      |

Monorepo via **npm workspaces**:

```
apps/web         Next.js app (UI + API)
apps/sync        Hocuspocus realtime service
packages/shared  Shared constants, Zod schemas, editor helpers
```

---

## Quick start (clone → running in < 10 min)

**Prerequisites:** Node 20+, npm 10+, Docker.

```bash
# 1. Install dependencies
npm install

# 2. Create your env file (one file, used by every service)
cp .env.example .env

# 3. Start Postgres + the sync service
docker compose up -d

# 4. Apply the schema and seed demo data
npm run db:migrate
npm run db:seed

# 5. Run the web app
npm run dev
```

Open <http://localhost:3000>. The sync service health check lives at
<http://localhost:1234/health>.

**Demo login (from Phase 1 onward):** `demo@demo.dev` / `demo1234`

---

## Scripts (run from the repo root)

| Script                | What it does                                     |
| --------------------- | ------------------------------------------------ |
| `npm run dev`         | Start the Next.js web app (`apps/web`)           |
| `npm run dev:sync`    | Run the sync service locally with hot reload     |
| `npm run build`       | Production build of the web app                  |
| `npm run db:generate` | Generate a new Drizzle migration from the schema |
| `npm run db:migrate`  | Apply pending migrations                         |
| `npm run db:seed`     | Reset + seed the demo workspace                  |
| `npm run db:studio`   | Open Drizzle Studio                              |
| `npm run lint`        | ESLint across workspaces                         |
| `npm run format`      | Prettier write                                   |
| `npm test`            | Vitest unit tests (web + sync)                   |
| `npm run test:e2e --workspace @dayfold/web` | Playwright smoke suite (needs the stack running) |

> When actively developing the sync service, stop its container
> (`docker compose stop sync`) and use `npm run dev:sync` for hot reload.

**Demo collaborator:** `demo2@demo.dev` / `demo1234` shares the demo workspace — log
in as them in a second browser to see live cursors/presence in a shared doc.

**Dev auth bypass:** set `DEV_AUTH_BYPASS=true` in `.env` to skip login during
development (auto-signs-in as the demo user). Ignored in production builds.

---

## Environment

All configuration lives in a single repo-root `.env` (see `.env.example` for every
variable, with comments). Google OAuth is optional — the app runs with email/password
only when its variables are blank.

---

## Phase status

Dayfold is built in agile phases. Current status:

- [x] **Phase 0** — Scaffold & foundations (monorepo, Docker, Drizzle schema, seed, sync skeleton)
- [x] **Phase 1** — Auth & workspace bootstrap (Better Auth, signup bootstrap, app shell, theme toggle)
- [x] **Phase 2** — Projects, sections, tasks + List view, side-peek, My Tasks, Trash
- [x] **Phase 3** — Board view (kanban DnD) + List drag-reorder + per-project view persistence
- [x] **Phase 4** — Block editor (Tiptap): slash menu, all blocks, image upload, persistence, turn-into/bubble menu, toggle block, drag-handle reorder
- [x] **Phase 5** — Realtime: Yjs + Hocuspocus (token auth, Postgres persistence), live collaborative editing, presence avatars, offline (y-indexeddb)
- [x] **Phase 6** — Notes app: nested page tree (drag re-parent), collaborative page editor, breadcrumbs, sub-page links, trash
- [x] **Phase 7** — Turn into task: taskBlock node, project/section picker, task_doc_links, two-way sync (checkbox↔task, live push, deletion degradation)
- [x] **Phase 8** — Calendar view (drag-reschedule), custom fields (per project, peek + badges), dependencies (blocked-by, cycle prevention, indicator)
- [x] **Phase 9** — Comments (edit/delete own, linkified), attachments (upload/download/thumbnails), keyboard shortcuts, Playwright smoke suite

**All phases complete.** 🎉

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the (future) self-hosting path.

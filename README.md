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

> When actively developing the sync service, stop its container
> (`docker compose stop sync`) and use `npm run dev:sync` for hot reload.

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
- [ ] **Phase 3** — Board view
- [ ] **Phase 4** — Block editor (static)
- [ ] **Phase 5** — Realtime (Yjs, Hocuspocus, live cursors)
- [ ] **Phase 6** — Notes app
- [ ] **Phase 7** — Turn into task (two-way sync)
- [ ] **Phase 8** — Calendar, custom fields, dependencies
- [ ] **Phase 9** — Comments, attachments, polish & hardening

See [`DEPLOYMENT.md`](./DEPLOYMENT.md) for the (future) self-hosting path.

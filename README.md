# Homeschool Helper Hub

A family organiser for homeschooling households: chores and homework with due dates,
a shared calendar, house rules, a points-and-rewards system for the kids, and a parent
admin view over all of it. One command to stand up, no external accounts required.

---

## Status

**Feature-complete and runnable.** The largest front end in this collection. Last worked
on 19 June 2025.

| | |
|---|---|
| Size | ~14,000 lines TypeScript (a large slice of that is the shadcn/ui component set) |
| API | 40 endpoints across tasks, events, house rules, family, invites, comments, files, rewards, profile and analytics |
| Web | 13 pages |
| Database | 9 Drizzle tables with a generated migration |
| Auth | Local session auth — first sign-in provisions an admin and a family. Replit OIDC was removed |
| Tests | None |
| Verified | Not re-run for this write-up. The one-command start below is the documented path and was working when the project was last touched |

### Pages

Dashboard · Chores · Homework · Schedule · Family Events · House Rules · Rewards ·
Family Management · Parent Admin · Profile · Invite Accept · Landing · 404

### Data model

`users` · `families` · `tasks` · `events` · `houseRules` · `comments` · `achievements` ·
`files` · `sessions`

Users carry a role (parent or child), a points balance and a completion streak. Tasks
carry an assignee, a due date and a point value; completing one updates the assignee's
points and streak, which feeds the rewards system and the parent analytics view.

### Known gaps

- **No tests.** Nothing here is covered.
- The notification system (`/api/reminders`) stores reminder configuration but has no
  SMS or email sender wired to it.
- File uploads go to a local volume via Multer — no object storage.
- Session storage is Postgres-backed with a 7-day TTL; there is no password reset flow.

---

## Stack

React 18 · TypeScript · Vite · Tailwind · shadcn/ui · TanStack Query · Wouter ·
React Hook Form + Zod · Express · Drizzle ORM · PostgreSQL · Docker Compose

---

## Running it

```bash
docker compose up --build
```

Open `http://localhost:5000` and click **Get Started — Sign In**. That first click
creates a local admin, creates a family, and signs you in. There is nothing to configure.

Without Docker:

```bash
npm install
npm run db:push        # requires DATABASE_URL
npm run dev            # tsx server/index.ts, Vite middleware in-process
```

`npm run build` compiles the client with Vite and bundles the server with esbuild to
`dist/`; `npm start` runs the bundle.

---

## Layout

```
client/src/
  pages/          13 pages
  components/     app components + the shadcn/ui set
  hooks/          useAuth, use-toast, use-mobile
  lib/            query client, auth helpers
server/
  routes.ts       40 endpoints (867 lines)
  storage.ts      data access layer (640 lines)
  auth.ts         local session auth
  db.ts           Drizzle + Postgres connection
shared/
  schema.ts       9 tables, shared between client and server
migrations/       generated Drizzle migration
```

---

## History

Started on Replit — `replit.md` is the original design note and still describes the
architecture accurately, apart from the auth section. Replit Auth (OIDC) was replaced
with local session auth so the app could run anywhere; `server/replitAuth.ts` is now a
two-line stub kept only so old imports resolve.

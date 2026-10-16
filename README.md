# Autopost — frontend

Web app for Autopost: store ideas, create programs that turn them into Instagram
carousels, reels and stories, and follow what was generated and published.

**Stack:** Next.js 16.4 (App Router, Cache Components, Partial Prefetching) · React 19 ·
TypeScript · Tailwind CSS v4 · shadcn/ui (new-york, Radix) · lucide-react · sonner.

## Getting started (Windows)

Requires Node.js ≥ 20.9.

```bat
cd "D:\Lavoro\AI Related\Autopost\autopost-frontend"
npm install
npm run dev
```

Open http://localhost:3000.

- `.npmrc` points npm's cache to `D:\Lavoro\AI Related\Autopost\.npm-cache`, so nothing
  is downloaded to drive C.
- `.env.local` has `AUTH_BYPASS=true`, so you can browse the UI before the backend
  login exists. Pages that need data show "The Autopost API is not reachable" until
  the FastAPI backend is running on `API_URL`.

| Script          | What it does                     |
| --------------- | -------------------------------- |
| `npm run dev`   | Dev server with Turbopack        |
| `npm run build` | Production build                 |
| `npm run start` | Serve the production build       |
| `npm run lint`  | ESLint                           |

## Environment

Copy `.env.example` to `.env.local` and adjust:

| Variable              | Default                 | Notes                                          |
| --------------------- | ----------------------- | ---------------------------------------------- |
| `API_URL`             | `http://localhost:8000` | FastAPI base URL. Server-side only.            |
| `SESSION_COOKIE_NAME` | `autopost_session`      | Cookie set by the backend after Google login.  |
| `AUTH_BYPASS`         | `false`                 | `true` only in development, never in prod.     |

## How it talks to the backend

```
Browser ──/api/*──▶ Next.js (rewrite) ──▶ FastAPI (API_URL)
Server Components ──────────────────────▶ FastAPI, forwarding the user's cookies
```

- **Same origin.** The browser only calls `/api/*`; `next.config.ts` rewrites it to the
  backend. The session cookie stays first-party and there is no CORS to configure.
- **Google OAuth lives in the backend.** "Continue with Google" is a plain link to
  `/api/auth/google/login`. For the cookie to land on the frontend origin, register
  the Google redirect URI **through the frontend**:
  `http://localhost:3000/api/auth/google/callback` (and the production equivalent).
  After the callback the backend sets the session cookie and redirects to `/`.
- **Route protection.** `src/proxy.ts` (the new name of `middleware.ts` in Next 16)
  redirects to `/login` when the session cookie is missing. It is an optimistic check:
  the backend still validates the session on every request.
- **Expected endpoints** are listed in `src/lib/api/endpoints.ts` and the response
  shapes in `src/lib/api/types.ts`. Both are drafts: align them with the FastAPI
  schemas (or generate the types from its OpenAPI spec).

| Method | Path                    | Used by                       |
| ------ | ----------------------- | ----------------------------- |
| GET    | `/auth/google/login`    | Login button (redirect)       |
| GET    | `/auth/me`              | Sidebar user menu             |
| POST   | `/auth/logout`          | Sign out                      |
| GET    | `/collections`          | Ideas, Programs               |
| GET    | `/ideas` · POST `/ideas`| Ideas                         |
| GET    | `/programs` · POST      | Programs                      |
| GET    | `/contents`             | Contents, Overview            |
| GET    | `/logs`                 | Logs, Overview                |
| GET    | `/instagram/account`    | Instagram account             |
| GET    | `/instagram/connect`    | "Connect Instagram" (redirect)|

## Project structure

```
src/
├─ app/
│  ├─ (auth)/login/          Sign-in page (public)
│  ├─ (app)/                 Authenticated area with the sidebar
│  │  ├─ page.tsx            01 Overview
│  │  ├─ ideas/              02 Ideas (+ new idea dialog)
│  │  ├─ programs/           03 Programs (+ new program dialog)
│  │  ├─ contents/           04 Generated contents
│  │  ├─ logs/               05 Logs
│  │  └─ account/            06 Instagram account
│  ├─ fonts/                 Self-hosted Instrument Serif
│  ├─ globals.css            Theme tokens (Tailwind v4 + shadcn)
│  └─ layout.tsx             Root layout, fonts, toaster
├─ components/
│  ├─ ui/                    shadcn/ui components
│  ├─ app-sidebar.tsx, nav.ts, page-header.tsx, user-menu*.tsx, …
├─ lib/
│  ├─ api/                   endpoints, types, browser client, server client
│  ├─ auth.ts                getCurrentUser(), AUTH_BYPASS
│  └─ format.ts              Date and label helpers
└─ proxy.ts                  Auth redirect
```

## Conventions

- **Cache Components is on.** Anything that reads cookies (every backend call from the
  server) must render inside `<Suspense>`; the static shell (sidebar, headers) loads
  instantly and data streams in. See `node_modules/next/dist/docs/` before using
  unfamiliar APIs: Next 16 differs from older versions.
- **Server reads, client writes.** Lists are fetched in Server Components with
  `serverApi`; forms call the browser `api` client, then `router.refresh()`.
- **Design.** "Paper & ink": warm off-white, near-black ink, one vermilion `signal`
  colour. Instrument Serif for titles, Geist for UI, Geist Mono for metadata. Surfaces
  stay flat (hairline rules, no shadows); images sit directly on the page, never in
  raised cards.
- **Adding shadcn components:** `npx shadcn@latest add <component>` (configured in
  `components.json`). If you also add `sidebar`, keep the two lint fixes already
  applied to `sidebar.tsx` and `hooks/use-mobile.ts`.

# TypeScript Next.js

A **Next.js + TypeScript** admin UI for the [demo backend API](../FastAPI-crud).
Built with **MUI** for the interface and the **React Context API** for auth state.

## What it does

- **Mock login** — signs in against configurable demo credentials (default `admin` / `admin`).
- A **JWT** is minted at login and sent as `Authorization: Bearer <token>` on every API call.
- **Left nav + top bar** with a logout menu.
- Pages for every backend resource: **Dashboard** (health/version/counts),
  **Users**, **Posts**, **Profiles**, and the **JSONPlaceholder** proxy.

## Run it

```bash
npm install
npm run dev
```

Then open http://localhost:3000 and sign in. Make sure the backend is running first.

## Configuration

Copy `.env.example` to `.env.local` and adjust as needed:

```bash
# Base URL of the backend API
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000

# Demo login credentials (mock auth). Defaults to admin/admin if unset.
NEXT_PUBLIC_ADMIN_USERNAME=admin
NEXT_PUBLIC_ADMIN_PASSWORD=admin
```

## Tech stack

Next.js 16 (App Router) · TypeScript · MUI v9 · React Context API · Axios

## Project structure

```
.
├── src/
│   ├── app/                    # App Router: one folder per route
│   │   ├── layout.tsx          # Root layout — MUI cache, theme, AuthProvider
│   │   ├── page.tsx            # "/" — bounces to /dashboard or /login
│   │   ├── login/page.tsx      # Mock sign-in form
│   │   └── (app)/              # Route group: everything behind auth
│   │       ├── layout.tsx      # Auth gate; renders the AppShell
│   │       ├── error.tsx       # Error boundary for the pages below it
│   │       ├── dashboard/page.tsx
│   │       ├── users/page.tsx
│   │       ├── posts/page.tsx
│   │       ├── profiles/page.tsx
│   │       └── jp-posts/page.tsx
│   ├── components/
│   │   └── AppShell.tsx        # Top bar, nav drawer, logout menu
│   ├── context/
│   │   └── AuthContext.tsx     # Token state + useAuth()
│   └── lib/
│       ├── api.ts              # Axios instance, interceptors, shared types
│       ├── services.ts         # One typed function per backend endpoint
│       ├── jwt.ts              # Mints and decodes the mock JWT
│       ├── useAsyncData.ts     # Shared load / error / refresh hook
│       ├── theme.ts            # MUI theme
│       └── *.test.ts           # Vitest unit tests
├── public/                     # Static assets served from /
├── .github/workflows/ci.yml    # Lint, typecheck, test, build on every PR
├── vitest.config.ts            # Tests: src/lib only, node environment
├── next.config.ts              # Next.js config
└── .env.example                # Copy to .env.local before running
```

### `src/app` — routes

Every page is a client component (`"use client"`), because auth state lives in
the browser and the pages fetch through Axios rather than on the server.

- **`layout.tsx`** wraps the whole app in the MUI Emotion cache, the theme, and
  `AuthProvider`, so any page can call `useAuth()`.
- **`(app)/`** is a *route group* — the parentheses keep it out of the URL, so
  the folder exists purely to share one layout. That layout is the auth gate: it
  waits for the token to be read from storage, redirects to `/login` if there
  isn't one, and otherwise renders the page inside `AppShell`.
- **`(app)/error.tsx`** catches render-time errors in the authenticated pages.
  Failed requests are handled per page as an inline alert; this is the backstop
  for everything else.

### `src/lib` — the API and logic layer

The only code with unit tests, and the only place that talks to the backend.

- **`api.ts`** creates the Axios instance and holds the two interceptors: one
  attaches `Authorization: Bearer <token>` to every request, the other catches a
  401, clears the token, and sends the browser back to `/login`. Shared response
  types (`User`, `Post`, `Profile`, …) live here too.
- **`services.ts`** is a thin typed wrapper per endpoint. Backend responses are
  wrapped in `APIResponse<T>` and unwrapped here — except the `/jp/*`
  JSONPlaceholder proxy routes, which return bare JSON.
- **`jwt.ts`** mints the mock token in the browser. The backend decodes without
  verifying the signature, so a structurally valid JWT is enough.
- **`useAsyncData.ts`** is the fetch-on-mount hook every list page uses. It
  returns `{ data, loading, error, refresh }` and cancels in-flight work on
  unmount. Its `fetcher` argument must be referentially stable — declare it at
  module scope or wrap it in `useCallback`, or the effect will refetch on every
  render.

### `src/context` and `src/components`

`AuthContext` holds the token, reading it straight from `localStorage` through
`useSyncExternalStore` — which also means signing out in one tab signs out the
others. `AppShell` is the frame around every authenticated page: the nav items
are a single array at the top of the file, so adding a page means adding a
folder under `(app)/` and one entry there.

> The login is a mock — there is no real auth server, and the credentials are
> shipped to the browser (`NEXT_PUBLIC_*`). It demonstrates the JWT-bearer flow
> against the demo backend; it is not a substitute for real authentication.

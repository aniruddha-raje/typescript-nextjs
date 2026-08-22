# Next.js TypeScript App

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

## Layout

```
src/
├── app/            # Routes (login + protected (app) group)
├── components/     # AppShell (top bar + drawer)
├── context/        # AuthContext
└── lib/            # api, services, jwt, theme
```

> The login is a mock — there is no real auth server, and the credentials are
> shipped to the browser (`NEXT_PUBLIC_*`). It demonstrates the JWT-bearer flow
> against the demo backend; it is not a substitute for real authentication.

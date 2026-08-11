# URL Shortener with Analytics

A full-stack URL shortening service with click analytics, custom slugs, link expiry, rate limiting, and JWT-based authentication. Built as project #2 in a self-directed backend learning roadmap, following a Notes/Todo API with sharing and RBAC.

## Features

- **User authentication** — register/login with hashed passwords (bcrypt), JWT access tokens, and rotating refresh tokens stored in `httpOnly` cookies
- **Short link creation** — auto-generated unique slugs (`nanoid`) or user-supplied custom slugs, with collision detection
- **Redirects** — fast, non-blocking `GET /:slug` redirect with atomic click counting
- **Click analytics** — per-link traffic-source breakdown and daily click counts via MongoDB aggregation pipelines
- **Link expiry** — optional `expireAt` field; expired links return `410 Gone` instead of redirecting
- **Ownership-based access control** — only a link's creator can view its stats or delete it
- **Rate limiting** — protects the link-creation endpoint from abuse
- **Automated tests** — Jest + Supertest integration tests covering auth flows, redirects, ownership checks, and rate limiting

## Tech Stack

**Backend**
- Node.js, Express
- MongoDB with Mongoose
- JWT (access + refresh token rotation), bcrypt
- Zod for request validation
- express-rate-limit
- nanoid for slug generation
- Jest, Supertest, postman(testing)

**Frontend**
- React (Vite)
- Redux Toolkit + RTK Query
- React Router
- Bootstrap (Bootswatch "Slate" theme)
- Recharts for click analytics visualization
- react-hot-toast for notifications

## Architecture Notes

### Why access tokens live in memory, not localStorage
The access token is kept only in Redux state, never persisted to `localStorage`. This limits exposure if the app is ever compromised by XSS, since there's no token sitting in browser storage for malicious script to read. The tradeoff — the token disappears on page refresh — is handled by a **silent refresh on app load**: the app calls `/auth/refreshToken` (which relies on the `httpOnly` refresh cookie the browser sends automatically) to re-establish a session before rendering protected routes.

### Why clicks and click logs are separate collections
`Url` documents stay small and fast to read, since every redirect depends on looking one up. `Click` documents are a separate, unbounded log collection — one per visit — so analytics data can grow indefinitely without ever slowing down the hot path (the redirect itself).

### Why click logging doesn't block the redirect
Click logging and the click-count increment are fired without `await`-ing their completion. The user gets redirected immediately; if analytics logging fails, it's logged server-side but never delays or breaks the redirect.

## API Reference

### Auth

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/auth/register` | — | Create a new account |
| POST | `/auth/login` | — | Log in, returns access token + sets refresh cookie |
| POST | `/auth/logout` | — | Revoke current session |
| POST | `/auth/refreshToken` | cookie | Rotate refresh token, issue new access token |
| GET | `/auth/getMe` | required | Get current user's profile |

### URLs

| Method | Route | Auth | Description |
|---|---|---|---|
| POST | `/api/urls` | required | Create a short URL (optional `customSlug`, `expireAt`) |
| GET | `/api/urls` | required | List the authenticated user's URLs |
| GET | `/api/urls/:slug/stats` | required, owner only | Traffic sources + daily click breakdown |
| DELETE | `/api/urls/:slug` | required, owner only | Delete a short URL and its click history |
| GET | `/:slug` | — | Public redirect to the original URL |

## Getting Started

### Prerequisites
- Node.js 18+
- MongoDB (local instance or Atlas)

### Backend setup

```bash
cd backend
npm install
```

Create a `.env` file:

```env
PORT=8000
MONGO_URI=mongodb://localhost:27017/url-shortener
MONGO_URI_TEST=mongodb://localhost:27017/url-shortener-test

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRY=7d
JWT_REFRESH_TOKEN_COOKIE_MAX_AGE=604800000
```

```bash
npm run dev
```

### Frontend setup

```bash
cd frontend
npm install
npm run dev
```

The frontend expects the backend running at `http://localhost:8000`. Update the `baseUrl` values in `src/features/*/*.api.js` if your backend runs elsewhere.

### Running tests

```bash
cd backend
npm test
```

Tests run against MongoDB (see `MONGO_URI_TEST` above) and cover registration, login, logout, token refresh, redirect behavior (valid/expired/nonexistent slugs), ownership enforcement, and rate limiting.

## Project Structure

```
backend/
├── src/
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.js
│   │   │   ├── auth.middleware.js
│   │   │   ├── auth.routes.js
│   │   │   ├── authUser.model.js
│   │   │   └── authSession.model.js
│   │   └── url/
│   │       ├── url.controller.js
│   │       ├── url.middleware.js
│   │       ├── url.model.js
│   │       ├── url.routes.js
│   │       ├── url.validation.js
│   │       └── click.model.js
│   ├── utils/
│   ├── tests/
│   └── app.js
frontend/
├── src/
│   ├── api/  (or features/*/api.js for RTK Query)
│   ├── app/store.js
│   ├── components/
│   ├── pages/
│   └── App.jsx
```

## Concepts Practiced

New backend concepts introduced in this project, beyond the auth/CRUD fundamentals from the previous project:

- Public (unauthenticated) redirect routes alongside protected CRUD routes
- Atomic MongoDB updates (`findOneAndUpdate` with `$inc`) to avoid race conditions on concurrent clicks
- Fire-and-forget async operations for non-critical side effects (logging) vs. awaited operations on the critical path (the redirect itself)
- MongoDB aggregation pipelines (`$group`, `$dateToString`, `$sort`) for analytics
- Rate limiting middleware and where it belongs in a middleware chain
- Ownership-based authorization (as distinct from role-based access control)
- Cross-origin cookie configuration (`SameSite`, `Secure`, `path`) for a separately-hosted frontend and backend
- Integration testing with Supertest against a real Express app and MongoDB instance

## Known Limitations / Future Improvements

- Click counts currently increment on every request to a slug, including repeated refreshes from the same visitor. A production version would deduplicate by IP (or another identity signal) within a time window.
- No pagination on the URL list endpoint — fine at small scale, would need `skip`/`limit` or cursor-based pagination for users with large numbers of links.
- No CI pipeline yet (GitHub Actions running tests on push is a planned addition).
# Notes App — Resource-Level RBAC Backend

A REST API for a collaborative notes application, built to practice **authentication**, **authorization**, and **resource-level access control** beyond simple route-level auth checks.

Unlike a typical CRUD API where authorization only answers "is this user logged in?", this project answers a harder question for every request: **"does this specific user have the right level of access to this specific note?"** — where access can be Owner, Editor, or Viewer, and is checked dynamically per resource rather than hardcoded per route.

---

## Features

- **Authentication**
  - Register / login with hashed passwords (bcrypt)
  - Access tokens (short-lived, sent via `Authorization: Bearer`) + refresh tokens (long-lived, stored in an `httpOnly` cookie)
  - Session model in MongoDB — refresh tokens are hashed before storage, never kept in plaintext
  - **Refresh token rotation**: every refresh issues a new token and invalidates the old one
  - **Reuse detection**: if an already-rotated-out refresh token is presented again, the entire session is revoked immediately (protects against stolen token replay)
  - Logout revokes the specific session; supports multiple concurrent sessions per user (multi-device)

- **Notes**
  - Full CRUD, image upload support for cover images (Multer + ImageKit)
  - Resource-level RBAC with three roles: `owner` > `editor` > `viewer`
  - Sharing: add / update / remove collaborators on a note, each with their own role
  - Note listing returns every note a user owns **or** has been shared

- **Testing**
  - Jest + Supertest integration test suite
  - Tests run against an isolated test database, never the dev database
  - Covers auth flows and Notes CRUD; RBAC/sharing test suite in progress

---

## Tech Stack

| Layer | Tech |
|---|---|
| Runtime | Node.js (ES Modules) |
| Framework | Express |
| Database | MongoDB + Mongoose |
| Auth | JWT (access + refresh), bcrypt |
| File uploads | Multer (memory storage) + ImageKit |
| Testing | Jest, Supertest |

---

## Project Structure

```
/src
  /models
    user.models.js
    session.models.js
    note.models.js
  /middlewares
    auth.middlewares.js        # verifyJWT
    requireRole.middlewares.js # resource-level RBAC gate
  /controllers
    auth.controllers.js
    note.controllers.js
  /routes
    auth.routes.js
    note.routes.js
  /utils
    auth.utils.js               # createSessionAndTokens
    permissions.utils.js        # getUserRole, hasMinimumRole
  /services
    storage.services.js         # ImageKit upload
  app.js                        # Express app (no .listen)
server.js                       # entrypoint, connects DB + listens
/tests
  jest.setup.js
  auth.test.js
  notes.test.js
```

---

## Authorization Model

Every note has one **owner** and zero or more **collaborators**, each assigned a role:

| Role | Read | Edit content | Delete note | Manage sharing |
|---|---|---|---|---|
| Viewer | ✅ | ❌ | ❌ | ❌ |
| Editor | ✅ | ✅ | ❌ | ❌ |
| Owner | ✅ | ✅ | ✅ | ✅ |

Authorization is enforced two different ways depending on the shape of the request:

- **Single-resource routes** (`/note/:id`, `/note/:id/share/:userId`) use a `requireRole(minRole)` middleware factory. It fetches the note, computes the requester's role via `getUserRole()`, and rejects with `403` before the controller ever runs.
- **List routes** (`GET /note`) have no single resource to gate — authorization is baked directly into the database query (`$or` across `owner` and `collaborators.user`), since the goal is filtering a collection, not gatekeeping one item.

---

## API Endpoints

### Auth — `/api/auth`

| Method | Route | Auth required | Description |
|---|---|---|---|
| POST | `/register` | No | Create account, returns access token + sets refresh cookie |
| POST | `/login` | No | Authenticate, returns access token + sets refresh cookie |
| POST | `/logout` | Refresh cookie | Revokes the current session |
| POST | `/refreshToken` | Refresh cookie | Rotates refresh token, issues new access token |
| GET | `/getMe` | Access token | Returns the logged-in user's profile |

### Notes — `/api/note`

| Method | Route | Min. role | Description |
|---|---|---|---|
| POST | `/createNote` | — (any logged-in user) | Create a note, optional cover image |
| GET | `/` | — (filtered by ownership/collaboration) | List all notes the user can access |
| GET | `/getNote/:id` | Viewer | Fetch a single note |
| PATCH | `/updateNote/:id` | Editor | Update title / content / cover image |
| DELETE | `/deleteNote/:id` | Owner | Delete a note |
| GET | `/:id/collaborators` | Viewer | List collaborators on a note |
| POST | `/:id/share` | Owner | Add a collaborator by email + role |
| PATCH | `/:id/share/:userId` | Owner | Change a collaborator's role |
| DELETE | `/:id/share/:userId` | Owner | Remove a collaborator |

---

## Environment Variables

Copy `.env.example` to `.env` and fill in real values.

```
PORT=
MONGO_URI=
MONGO_URI_TEST=

JWT_ACCESS_SECRET=
JWT_ACCESS_EXPIRY=
JWT_REFRESH_SECRET=
JWT_REFRESH_EXPIRY=
JWT_REFRESH_TOKEN_COOKIE_MAX_AGE=

IMAGEKIT_PUBLIC_KEY=
IMAGEKIT_PRIVATE_KEY=
IMAGEKIT_URL_ENDPOINT=

NODE_ENV=
```

> `MONGO_URI_TEST` must point to a **separate database** from `MONGO_URI` — the test suite freely creates and deletes data.

---

## Getting Started

```bash
# install dependencies
npm install

# set up environment variables
cp .env.example .env
# fill in .env with real values

# run the dev server
npm run dev

# run the test suite
npm test
```

---

## Testing

```bash
npm test
```

- Tests run against `MONGO_URI_TEST`, never the development database.
- `tests/jest.setup.js` loads environment variables and configures DNS resolution before any test file imports the app (required for `mongodb+srv://` connection strings on networks with SRV lookup issues).
- Current coverage: registration/login validation, Notes CRUD (create/read/update/delete) across owner and non-owner access. Resource-level RBAC and collaborator sharing tests are in active development.

---

## Design Notes / Things Worth Knowing

- **Password hashes are never returned** in any API response (`select: false` at the schema level).
- **Refresh tokens are hashed before being stored** — the database never holds a usable refresh token, only its bcrypt hash, mirroring how passwords are stored.
- **Sessions are per-device**, not per-user — a user can be logged in on multiple devices simultaneously, and each session can be revoked independently.
- **Middleware vs. query-based authorization** is a deliberate split: single-resource access control lives in middleware (`requireRole`), while list-based access control lives in the query itself — these solve genuinely different problems and shouldn't be forced into the same pattern.

---

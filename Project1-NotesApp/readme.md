📝 Notes App — Resource-Level RBAC, Full StackA full-stack collaborative notes application built to go deeper than typical CRUD tutorials — the focus is authentication security and resource-level authorization, not just "is this user logged in," but "does this specific user have the right level of access to this specific note?"Three roles — Owner, Editor, Viewer — govern what a user can do with a note they don't personally own, enforced identically on the backend (middleware-gated) and reflected live in the frontend (buttons and fields hide/disable based on role).✨ Highlights🔐 Refresh token rotation with reuse detection — every refresh invalidates the previous token; presenting an already-rotated-out token revokes the entire session, protecting against stolen-token replay.🧩 Resource-level RBAC, not route-level — a requireRole(minRole) middleware factory computes each user's role per note, dynamically, on every request.👥 Live collaboration controls — owners can share notes, promote/demote collaborators, and revoke access; changes take effect immediately on the collaborator's next request.🖼️ Image uploads via Multer + ImageKit for note cover images.🧪 Automated test suite — Jest + Supertest, covering auth flows, CRUD, and multi-user RBAC scenarios (viewer vs. editor vs. owner permission boundaries).🎨 React + Redux Toolkit + React Router frontend — role-aware UI that uses declarative routing, disables editing for viewers, and hides owner-only actions from non-owners.🛠️ Tech StackLayerTechnologyBackend runtimeNode.js (ES Modules), ExpressDatabaseMongoDB + MongooseAuthJWT (access + refresh), bcryptFile uploadsMulter (memory storage) + ImageKitTestingJest, SupertestFrontendReact (Vite), Redux Toolkit, React Router, Axios, Bootswatch🏗️ Architecture OverviewPlaintext┌───────────────────┐        ┌────────────────────┐        ┌─────────────┐
│   React (Vite)     │ ─────▶ │   Express API       │ ─────▶ │  MongoDB    │
│  Redux Toolkit      │  JWT   │  verifyJWT →         │        │  Mongoose   │
│  React Router       │        │  requireRole →       │        └─────────────┘
│  Axios + interceptors        │  controller          │
└───────────────────┘        └────────────────────┘
                                       │
                                       ▼
                               ┌──────────────┐
                               │  ImageKit     │  (cover images)
                               └──────────────┘
🔑 Authorization ModelEvery note has exactly one owner and zero or more collaborators, each with an assigned role.RoleReadEditDeleteManage SharingViewer✅❌❌❌Editor✅✅❌❌Owner✅✅✅✅Two distinct enforcement strategies, deliberately:Single-resource routes (/note/:id, /note/:id/share/:userId) use requireRole(minRole) — middleware that fetches the note, computes the requester's role, and rejects with 403 before the controller ever runs.List routes (GET /note) have no single resource to gate against — authorization is baked directly into the database query itself ($or across owner and collaborators.user), since the goal is filtering a collection, not gatekeeping one item.The frontend integration: The computed userRole is returned from the backend on note fetches. The frontend uses this along with client-side helper utilities (getUserRole / hasMinimumRole) to cleanly hide/disable controls the user isn't permitted to use. Note: Hiding UI elements client-side is a UX convenience — the backend's requireRole middleware is what truly enforces the security boundary.📁 Project StructurePlaintext/backend
  /src
    /models            user, session, note
    /middlewares        verifyJWT, requireRole
    /controllers        auth, note
    /routes              auth, note
    /utils               auth helpers, permissions (getUserRole, hasMinimumRole)
    /services            ImageKit upload
    app.js               Express app (no .listen)
  server.js              entrypoint — connects DB, starts listening
  /tests
    jest.setup.js         loads env vars + DNS fix before test imports
    auth.test.js
    note.test.js           includes multi-user RBAC scenarios

/frontend
  /src
    /api
      axiosInstance.js     configured Axios instance + interceptors
      authApi.js
      noteApi.js
      shareApi.js
    /features
      /auth
        authSlice.js
        Login.jsx
        Register.jsx
      /notes
        notesSlice.js
        NotesList.jsx
        NoteEditor.jsx
        ShareModal.jsx
    /app
      store.js
    /routes                AppRoutes.jsx / ProtectedRoute.jsx
    App.jsx
    main.jsx
🔌 API ReferenceAuth — /api/authMethodRouteAuthDescriptionPOST/register—Create account, returns access token + sets refresh cookiePOST/login—Authenticate, returns access token + sets refresh cookiePOST/logout🍪Revokes the current sessionPOST/refreshToken🍪Rotates refresh token, issues new access tokenGET/getMe🔑Returns the logged-in user's profileNotes — /api/noteMethodRouteMin. RoleDescriptionPOST/createNote—Create a note (optional cover image)GET/getNotes—List every note the user owns or collaborates onGET/getNote/:idViewerFetch a single note (+ userRole)PATCH/updateNote/:idEditorUpdate title / content / cover imageDELETE/deleteNote/:idOwnerDelete a noteGET/:id/collaboratorsViewerList collaborators on a notePOST/:id/shareOwnerAdd a collaborator by email + rolePATCH/:id/share/:userIdOwnerChange a collaborator's roleDELETE/:id/share/:userIdOwnerRemove a collaboratorLegend: 🔑 = requires Authorization: Bearer <accessToken> · 🍪 = requires the refreshToken HttpOnly cookie⚙️ Environment VariablesBackend — copy .env.example → .env:Code snippetPORT=
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
⚠️ MONGO_URI_TEST must point to a separate database from MONGO_URI — the test suite freely creates and deletes data.FrontendaxiosInstance.js points at the backend's base URL (http://localhost:8000/api by default); update this if your backend runs elsewhere.🚀 Getting StartedBash# Backend
cd backend
npm install
cp .env.example .env      # fill in real values
npm run dev                 # starts on PORT from .env

# Frontend
cd frontend
npm install
npm run dev                 # Vite dev server, default http://localhost:5173
Make sure the backend's CORS config allows the frontend's origin (http://localhost:5173) with credentials: true, and that the frontend's Axios instance has withCredentials: true — both are required for the refresh-token cookie flow to work.🧪 TestingBashcd backend
npm test
Runs sequentially (--runInBand) against MONGO_URI_TEST — never the dev database.jest.setup.js loads environment variables and configures DNS resolution before any test file imports the app (required for mongodb+srv:// connection strings on networks with SRV lookup restrictions).Coverage includes:Registration / login validation, duplicate handling, token refresh + rotation, session revocation on logout.Notes CRUD across owner and non-owner access.Multi-user RBAC scenarios — viewer blocked from editing, editor blocked from deleting, removed collaborator immediately losing access — using three simultaneously-registered test users (owner, collaborator, stranger).🖥️ Frontend & Routing NotesReact Router Implementation: The frontend utilizes declarative routing (react-router-dom) to manage distinct views (such as authentication pages vs. dashboard views and individual note editors), ensuring clean URL structures and browser history management.Redux Scope: Redux holds only genuinely shared state — user, accessToken, the notes list, the active note, and permissions. Form input values (email, password, note title while editing) stay in local component state; putting every keystroke in Redux was avoided on purpose.Server-Computed Roles: userRole is computed server-side and trusted by the UI. Rather than duplicating complex permission checks everywhere, the backend's requireRole middleware computes the role on note requests, and the frontend uses it alongside permission utilities to dynamically adapt controls.State Reset on Logout: notesSlice resets fully on logout (logout.fulfilled triggers a full state reset) — this prevents a stale userRole or activeNote from a previous session bleeding into whichever account logs in next in the same browser tab.🔒 Security Design NotesPassword security: Password hashes are never returned in any API response (select: false at the schema level).Token hashing: Refresh tokens are hashed before storage — the database never holds a usable refresh token, only its bcrypt hash, mirroring how passwords are stored.Session isolation: Sessions are per-device, not per-user — a user can be logged in on multiple devices simultaneously, and each session can be revoked independently.Reuse detection: Since tokens are rotated on every refresh, only one valid refresh token should ever exist per session at a time. If an already-superseded token is presented, the session is revoked outright rather than just rejecting the one bad token — treating reuse as a signal of compromise, not a race condition.🗺️ Roadmap[ ] Centralized Express error-handling middleware[ ] Input validation via Zod[ ] Dockerize (Dockerfile + docker-compose with Mongo)[ ] Real-time collaborator/role updates (would require WebSockets — currently role changes require a re-fetch)[ ] logoutAllDevices endpoint📄 LicensePersonal learning project — free to reference or adapt.
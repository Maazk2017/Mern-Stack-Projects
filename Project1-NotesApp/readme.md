# 📝 Notes App — Resource-Level RBAC, Full Stack

A full-stack collaborative notes application built to explore **authentication security** and **resource-level authorization**. Beyond basic authentication ("is this user logged in?"), this project enforces fine-grained permissions ("does this specific user have access to this specific note?").

Three distinct roles — **Owner**, **Editor**, and **Viewer** — govern what a user can do with a note. Permissions are enforced server-side via custom middleware and reflected dynamically in the frontend UI.

---

<img width="1322" height="647" alt="image" src="https://github.com/user-attachments/assets/ab61f853-534d-4b87-bae9-65306b0781a9" />


<img width="1439" height="597" alt="image" src="https://github.com/user-attachments/assets/6c1d5760-22a5-4893-b789-c1863d567472" />


<img width="1466" height="700" alt="image" src="https://github.com/user-attachments/assets/8d22e5fe-bdb2-4abf-b8e3-efd23f082316" />


<img width="1066" height="701" alt="image" src="https://github.com/user-attachments/assets/58165dad-042d-4f9d-b2e5-961c503a6aa1" />


<img width="430" height="355" alt="image" src="https://github.com/user-attachments/assets/c31244d9-c564-4594-9506-365ed342b184" />


<img width="1058" height="680" alt="image" src="https://github.com/user-attachments/assets/7e5cb65b-5c7f-4b7a-af13-abe4c1dd1e5b" />


## ✨ Key Highlights

* 🔐 **Refresh Token Rotation & Reuse Detection**: Every refresh invalidates the previous token. Presenting an already-rotated-out token revokes the entire session to prevent stolen-token replay attacks.
* 🧩 **Resource-Level RBAC**: A custom `requireRole(minRole)` middleware factory dynamically computes each user's access role per note on every request.
* 👥 **Live Collaboration Controls**: Owners can share notes, promote/demote collaborators, and revoke access.
* 🖼️ **Image Uploads**: Note cover images handled via Multer (memory storage) and ImageKit.
* 🧪 **Automated Test Suite**: Built with Jest & Supertest, covering auth flows, CRUD actions, and multi-user RBAC scenario boundaries.
* 🎨 **Role-Aware Frontend**: React, Redux Toolkit, and React Router UI that dynamically disables editing for viewers and hides owner-only actions.

---

## 🛠️ Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend Runtime** | Node.js (ES Modules), Express |
| **Database** | MongoDB, Mongoose |
| **Authentication** | JWT (Access + Refresh tokens, sessions), bcrypt |
| **File Storage** | Multer, ImageKit API |
| **Testing** | Jest, Supertest |
| **Frontend** | React (Vite), Redux Toolkit, React Router, Axios, Bootswatch |

---

## 🏗️ Architecture Overview

```text
┌───────────────────┐        ┌────────────────────┐        ┌─────────────┐
│   React (Vite)    │ ─────▶ │    Express API     │ ─────▶ │   MongoDB   │
│   Redux Toolkit   │  JWT   │   verifyJWT        │        │   Mongoose  │
│   React Router    │        │   requireRole      │        └─────────────┘
│   Axios           │        │   Controllers      │
└───────────────────┘        └────────────────────┘
                                       │
                                       ▼
                             ┌───────────────────┐
                             │     ImageKit      │ (Cover Images)
                             └───────────────────┘
```

🔑 Authorization ModelEvery note has one owner and zero or more collaborators, each assigned a specific role.RoleReadEditDeleteManage Sharing Viewer✅❌❌❌Editor✅✅❌❌Owner✅✅✅✅Enforcement StrategySingle-Resource Routes (/note/:id, /note/:id/share/:userId):Gated by requireRole(minRole) middleware. It fetches the note, evaluates the user's role, and returns 403 Forbidden before controller execution if unauthorized.List Routes (GET /note):Authorization is built into the MongoDB query using $or conditions across owner and collaborators.user arrays to filter results at the database level.Frontend Integration:The backend returns the computed userRole with note fetches. The client uses helper utilities (getUserRole / hasMinimumRole) to disable UI controls. Client-side hiding serves UX purposes only; backend middleware enforces actual security.📁 Project StructurePlaintext/backend
  ├── /src
  │     ├── /models          # User, Session, Note schemas
  │     ├── /middlewares     # verifyJWT, requireRole
  │     ├── /controllers     # Auth, Note controllers
  │     ├── /routes          # Auth, Note routes
  │     ├── /utils           # Auth & permission utilities
  │     ├── /services        # ImageKit upload service
  │     └── app.js           # Express app setup
  ├── server.js              # Entrypoint (DB connection & server listener)
  └── /tests                 # Jest & Supertest integration tests

/frontend
  ├── /src
  │     ├── /api             # Axios instance & API endpoints
  │     ├── /features        # Redux slices & UI components (Auth, Notes)
  │     ├── /routes          # AppRoutes & ProtectedRoute wrapper
  │     ├── /app             # Redux store configuration
  │     ├── App.jsx
  │     └── main.jsx
🔌 API ReferenceAuth Routes (/api/auth)MethodEndpointAuthDescriptionPOST/register—Register account; returns access token & sets refresh cookiePOST/login—Authenticate user; returns access token & sets refresh cookiePOST/logout🍪Revokes active sessionPOST/refreshToken🍪Rotates refresh token & issues new access tokenGET/getMe🔑Retrieves logged-in user profileNote Routes (/api/note)MethodEndpointMin. RoleDescriptionPOST/createNote—Create a new noteGET/getNotes—Fetch all notes owned or collaborated onGET/getNote/:idViewerFetch single note (+ userRole)PATCH/updateNote/:idEditorUpdate title, content, or cover imageDELETE/deleteNote/:idOwnerDelete a noteGET/:id/collaboratorsViewerList note collaboratorsPOST/:id/shareOwnerAdd collaborator by email and rolePATCH/:id/share/:userIdOwnerUpdate collaborator roleDELETE/:id/share/:userIdOwnerRemove collaboratorLegend: 🔑 = Requires Authorization: Bearer <accessToken> · 🍪 = Requires refreshToken HttpOnly Cookie⚙️ Environment VariablesBackend ConfigurationCreate a .env file in the /backend directory based on .env.example:Code snippetPORT=8000
MONGO_URI=mongodb+srv://...
MONGO_URI_TEST=mongodb+srv://...

JWT_ACCESS_SECRET=your_access_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_SECRET=your_refresh_secret
JWT_REFRESH_EXPIRY=7d
JWT_REFRESH_TOKEN_COOKIE_MAX_AGE=604800000

IMAGEKIT_PUBLIC_KEY=your_imagekit_public_key
IMAGEKIT_PRIVATE_KEY=your_imagekit_private_key
IMAGEKIT_URL_ENDPOINT=[https://ik.imagekit.io/your_endpoint](https://ik.imagekit.io/your_endpoint)

NODE_ENV=development
⚠️ Note: MONGO_URI_TEST must point to an isolated database instance as the test runner drops collection data during execution.🚀 Local Development Setup1. Clone & Install DependenciesBash# Install backend dependencies
cd backend
npm install

# Install frontend dependencies
cd ../frontend
npm install
2. Start ApplicationBash# Run backend (from /backend directory)
npm run dev

# Run frontend (from /frontend directory)
npm run dev
🧪 TestingBashcd backend
npm test
Tests run sequentially (--runInBand) against MONGO_URI_TEST.Coverage Highlights:Authentication validation, token refresh cycles, and session revocation.Resource CRUD authorization across roles.Multi-user RBAC boundary scenarios (Viewer, Editor, Owner isolation).🔒 Security DesignPassword Security: Hashes are hidden at the schema level (select: false).Hashed Refresh Tokens: Stored in the database as bcrypt hashes.Session Isolation: Sessions are managed per-device. Revoking one session does not impact active sessions on other devices.Reuse Detection: Presenting a revoked or old refresh token triggers immediate invalidation of all sessions associated with that family.📄 LicenseDistributed under the MIT License. Open for reference and educational use.

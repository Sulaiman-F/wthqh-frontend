## WTHQH — MERN document manager (short README)

### Repositories
- Backend: https://github.com/Sulaiman-F/wthqh-backend

### Architecture

- Client: React (Vite) SPA talks to an Express/TypeScript API via JSON over HTTPS. Auth uses JWT (access + refresh) stored in localStorage. Axios interceptors attach tokens and attempt a single refresh on 401.
- Server: Express + Mongoose on MongoDB. PDF files are stored via GridFS; metadata, users, folders, shares, and versions are in MongoDB collections. Share links expose a read-only public endpoint. Audit logs track actions.

```
[React SPA] ⇄ [Express API] ⇄ [MongoDB + GridFS]
		 ▲               ▲
		 │JWT (access/refresh), CORS, Helmet
		 └── Postman collection for manual testing
```

### Tech stack (and why)

- React + Vite: fast DX, simple SPA routing and state.
- Tailwind CSS: quick, consistent styling and dark-mode utilities.
- Axios: interceptors for auth, progress for uploads.
- Express + TypeScript: familiar, typed backend with clear controllers/routes.
- MongoDB + Mongoose: flexible schema for folders/documents/versions; GridFS for large PDF storage.
- JWT auth: stateless, works well with SPA; refresh tokens reduce logouts.

### Environment variables

Frontend (.env.local):

- VITE_API_URL=http://localhost:5000/api

Backend (.env):

- MONGO_URI=mongodb+srv://... (or mongodb://localhost:27017/wthqh)
- JWT_SECRET=your_access_secret
- JWT_REFRESH_SECRET=your_refresh_secret
- PORT=5000
- CORS_ORIGIN=http://localhost:5173 (dev front-end origin)

### Run locally

1. Backend

- In `wthqh-backend`: install deps, add `.env` (see above), then start.
  - Dev: npm install; npm run dev
  - Prod: npm run build; npm start

2. Frontend

- In `wthqh-frontend`: create `.env` with `VITE_API_URL` and start.
  - Dev: npm install; npm run dev
  - Build: npm run build; npm run preview

### DB migrations & seed

- Migrations: schema is managed via Mongoose models; no formal migration tool is wired. Introduce a migration runner if/when needed (e.g., MongoDB migrations or a lightweight node script that batches updates).
- Seed (quick start): import the Postman collection `wthqh-backend/postman/WTHQH API.postman_collection.json`.
  1.  Call `Auth / Signup` to create your first user (admin role can be assigned via DB or an admin-only endpoint if present).
  2.  Use `Folders / Create` to make a root folder and `Documents / Upload` to add a PDF.
  3.  Optional: `Share / Create` to generate a public link and test public preview.

### How AI tools were used

GitHub Copilot was used as a pair-programmer to scaffold boilerplate (routes/controllers, axios service layer), refactor repeated strings into an i18n layer, and draft UI patterns (upload progress, skeletons, RTL-aware icons). Suggestions were iteratively reviewed, edited, and verified with local builds and manual tests.

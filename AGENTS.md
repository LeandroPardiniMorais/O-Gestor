# Repository Guidelines

## Project Structure & Module Organization
The project is split into `backend/` (Express API) and `frontend/` (Vite + React/TypeScript). `backend/server.js` exposes a `/api` health endpoint and reads the `PORT` environment variable. `frontend/src/` keeps reusable UI under `components/`, routed views under `pages/`, and global styles in `App.css`, `index.css`, and `style.css`; place static media in `src/assets/`. Use `start-app.bat` in the repository root to launch both servers after dependencies are installed; it opens dedicated terminals for each stack.

## Build, Test, and Development Commands
- `cd backend && npm install` once per environment; rerun only after dependency changes.
- `cd backend && npm start` bootstraps the API on port 3001 (override with `PORT=xxxx`).
- `cd frontend && npm install` prepares the React client.
- `cd frontend && npm run dev` runs Vite with hot reload; `npm run preview` serves the built bundle.
- `cd frontend && npm run build` emits production assets in `dist/`; `npm run lint` enforces ESLint rules.

## Coding Style & Naming Conventions
TypeScript files use the ESLint config in `frontend/eslint.config.js`; keep two-space indentation and single quotes in both stacks. Name React components and pages with PascalCase (`Dashboard.tsx`), hooks with `useCamelCase`, and utility functions in camelCase. Co-locate component-specific styles next to the component or in `style.css`; document shared types in `App.tsx` until a dedicated `types/` module is introduced.

## Testing Guidelines
Add frontend tests with Vitest and React Testing Library in `frontend/src/__tests__`, naming files `ComponentName.test.tsx`. Stub API calls with MSW or fetch mocks so tests stay hermetic. For the backend, introduce Jest and Supertest under `backend/tests/` to cover routing and headers; aim for at least 80% coverage on critical modules. Keep fixtures in plain JSON next to the test that uses them.

## Commit & Pull Request Guidelines
Adopt conventional commits (`feat(frontend): add dashboard cards`) written in the imperative mood. Bundle related backend and frontend changes in separate commits when possible. Pull requests should explain the intent, list test evidence (`npm run lint`, new test commands), and attach UI screenshots or API samples when behavior changes. Reference tracked issues using `Closes #id` in the description.

## Environment & Integration Notes
The API enables CORS globally; prefer configuring allowed origins before production deploys. The frontend expects the API at `http://localhost:3001`; expose a `VITE_API_URL` in a `.env.local` when pointing to another host. When editing `start-app.bat`, keep commands idempotent so first-run onboarding stays reliable.

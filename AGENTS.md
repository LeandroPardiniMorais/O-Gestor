# Repository Guidelines

## Project Structure & Module Organization
The `frontend/` directory houses the Vite + React app. Share reusable UI through `frontend/src/components/`, keep page-level views in `frontend/src/pages/`, and align global styling across `frontend/src/App.css`, `frontend/src/index.css`, and `frontend/src/style.css`. Place Vitest suites in `frontend/src/__tests__/`, keeping test fixtures adjacent to their specs, and store static assets under `frontend/src/assets/`. The Express API lives in `backend/server.js` with integration coverage in `backend/tests/`. Use `docker compose up -d` to bring up any required services before launching either side.

## Build, Test, and Development Commands
Install dependencies once per workspace: `cd frontend && npm install` and `cd backend && npm install`. Run the web app locally via `npm run dev` inside `frontend/`. Validate quality with `npm run lint`, `npm run test`, and `npm run build && npm run preview` before sharing UI changes. Start the API using `npm start` in `backend/` (set `PORT=4000` if 3001 is occupied) and confirm routes with `npm run test`.

## Coding Style & Naming Conventions
JavaScript and TypeScript follow 2-space indentation, single quotes, and omit semicolons; avoid auto-formatters that fight the existing lint rules. Use PascalCase for React components and pages, prefix custom hooks with `use`, and prefer camelCase utilities. Surface shared types through `frontend/src/App.tsx` where applicable.

## Testing Guidelines
Write frontend specs in `frontend/src/__tests__/ComponentName.test.tsx` using Vitest, mocking HTTP traffic with MSW or fetch stubs. Target at least 80% coverage for backend routes via Jest + Supertest in `backend/tests/`. Run `npm run test` within both `frontend/` and `backend/` before opening a pull request.

## Commit & Pull Request Guidelines
Adopt Conventional Commits such as `feat(frontend): add dashboard cards`, keeping UI and API updates in separate commits. Pull requests must describe intent, list verification steps (lint, tests, build), link issues with `Closes #id`, and attach screenshots or API samples when relevant. Document new environment variables or configuration changes directly in the PR body so reviewers can update local setups quickly.

## Security & Configuration Tips
Copy `.env.example` to `.env` and `backend/.env.example` to `backend/.env` before running servers. Adjust `frontend/.env.local` when API ports move, restrict backend CORS origins ahead of production, and verify database health via `GET /api/db/status`. Keep credentials out of version control and rotate tokens shared during testing.

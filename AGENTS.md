# Repository Guidelines

## Project Structure & Module Organization
- ackend/ hosts the Express API; entry point server.js exposes /api health check and reads PORT.
- rontend/ contains Vite + React/TypeScript; shared UI lives under src/components/, route views under src/pages/, assets in src/assets/.
- Tests live in ackend/tests/ (Jest + Supertest) and rontend/src/__tests__/ (Vitest), fixtures as JSON beside tests.
- Global styles sit in rontend/src/App.css, index.css, and style.css; component styles travel with the component.

## Build, Test, and Development Commands
- cd backend && npm install once per environment; rerun after dependency updates.
- cd backend && npm start boots the API on port 3001 (override via PORT=4000 npm start).
- cd frontend && npm install prepares client dependencies.
- cd frontend && npm run dev serves the app with hot reload; 
pm run build outputs dist/; 
pm run preview checks the production bundle.
- cd frontend && npm run lint enforces project ESLint rules.

## Coding Style & Naming Conventions
- Standardize on two-space indentation and single quotes in JS/TS.
- Name React components/pages in PascalCase, hooks prefixed with use, utilities in camelCase.
- Keep shared types in rontend/src/App.tsx until a 	ypes/ module emerges; align with eslint.config.js.

## Testing Guidelines
- Frontend tests use Vitest + React Testing Library; name files ComponentName.test.tsx; run cd frontend && npm run test.
- Backend tests use Jest + Supertest; run cd backend && npm run test; target =80% coverage on critical routes.
- Mock remote calls with MSW or fetch stubs; keep fixtures as adjacent JSON files.

## Commit & Pull Request Guidelines
- Follow Conventional Commits, e.g., eat(frontend): add dashboard cards.
- Separate backend and frontend work into focused commits when possible.
- Pull requests should describe intent, list verification steps (
pm run lint, tests), attach UI screenshots or API samples for behavior changes, and reference issues with Closes #id.

## Environment & Configuration Tips
- API enables CORS globally; tighten allowed origins before production.
- Frontend expects the API at http://localhost:3001; set VITE_API_URL in .env.local for other hosts.
- Use start-app.bat in the repo root to launch both servers in dedicated terminals.

## Database & Docker Setup
- Copy .env.example (root) to .env, then adjust credentials if needed before running Docker Compose.
- Start the stack with docker compose up -d; MySQL binds to the configured MYSQL_PORT (default 3307) and phpMyAdmin to PHPMYADMIN_PORT (default 8081).
- Visit http://localhost:8081 (or the port you set) to manage data through phpMyAdmin.
- Duplicate ackend/.env.example to ackend/.env so the API can reach the containerised database.
- Hit GET /api/db/status while the backend is running to confirm connectivity with MySQL.
- Personalize o esquema editando mysql/init.sql antes do primeiro docker compose up. Utilize docker compose down -v se precisar recriar as tabelas do zero.

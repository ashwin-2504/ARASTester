# APPLICATION_CONTEXT

Code-verified context for the current implementation.
Last verified: 2026-03-07

## Purpose

ARASTester is an Electron desktop application for automating and organizing ARAS PLM testing workflows, aimed at QA testers and configuration developers.

## High-Level Architecture

- Desktop shell: Electron (`main.js`, `preload.js`)
- Frontend: React + Vite + Zustand (renderer process)
- Backend: ASP.NET Core (.NET 8) API
- ARAS integration: Aras.IOM gateway/session manager
- Storage: local JSON files through Electron IPC file APIs

## Runtime Model

- Electron main process spawns the backend executable and opens the desktop UI window.
- Backend URL is `http://localhost:${BACKEND_PORT || 5000}`.
- Renderer API calls default to `http://localhost:5000` (overridable via `VITE_API_URL`).
- Frontend session state is cached in Zustand, but backend session store is authoritative.
- Session identity is resolved per request: `X-Session-Name` header first, then `ARAS_SESSION_ID` cookie.

## Key Invariants

1. Backend `ConnectionStore` is the source of truth for active sessions.
2. `useSessionStore` syncs state through `GET /api/aras/sessions` after login/logout.
3. Item APIs require an active session (`[ArasAuthorize]` on `ItemController`).
4. Session selection can be overridden per API call using `X-Session-Name`.

## Entry Points

- Electron main: `main.js`
- Preload bridge: `preload.js` (compiled from `preload.ts`)
- HTML host: `index.html` (loads `/renderer/app/main.jsx`)
- React app entry: `renderer/app/main.jsx` -> `renderer/app/App.tsx`
- Backend app entry: `backend/ArasBackend/Program.cs`

## Frontend Behavior

- Routing: `HashRouter` with `/dashboard`, `/plan/:filename`, `/settings` and redirect `/ -> /dashboard`.
- Global error boundary in `App.tsx` renders fallback UI on uncaught React errors.
- Action execution is schema-driven via `action-schemas.json` and `ActionRegistry`.
- `ActionExecutor` supports both client-side actions (`Wait`, `LogMessage`, `SetVariable`) and server-side API actions.
- API client normalizes PascalCase responses to camelCase and supports retries + request cancellation.

## API Surface (Backend)

Base route: `/api/aras` (controllers)

- Connection endpoints:
  - `POST /connect`
  - `POST /disconnect`
  - `POST /disconnect/{sessionName}`
  - `GET /sessions`
  - `GET /connection-status`
  - `GET /validate`
- Item endpoints include CRUD, lock/state, relationships, AML/SQL/method, assertions, workflow, file, and utility operations.
- Health endpoint: `GET /api/status`.

## Backend Composition

- DI registration:
  - Infrastructure: `ConnectionStore` (singleton), `ArasSessionManager` (scoped), and gateway interfaces.
  - Application: `ConnectionAppService`, `ItemAppService` (scoped).
- Middleware pipeline:
  - `ExceptionHandlingMiddleware`
  - `UseHttpsRedirection()` outside Development
  - `UseCors("AllowLocalhost")`
  - `MapControllers()`
- Session manager:
  - Creates `HttpServerConnection` via IOM.
  - Performs login with timeout (120s).
  - Stores sessions by session name in process memory.
  - Serializes per-session IOM calls with `lock (session.Lock)`.

## Security Posture (Code-Observed)

- Electron BrowserWindow security:
  - `contextIsolation: true`
  - `nodeIntegration: false`
- IPC filesystem security in `main.js`:
  - allowlist of authorized base directories
  - path normalization + fast traversal rejection
  - canonical path containment check
- CORS policy:
  - Development: any `localhost` origin
  - Production: configured `Cors:AllowedOrigins`
- Item endpoints enforce session presence using `ArasAuthorizeAttribute`.
- Session is conveyed by HTTP-only cookie (`ARAS_SESSION_ID`) and/or `X-Session-Name` header.
- No JWT/Identity/RBAC framework is present in current code.
- CSP in `index.html` currently permits `'unsafe-inline'` and `'unsafe-eval'` for scripts.

## Core Technology Stack

- Frontend: React 19, React Router, Zustand, Tailwind CSS, Radix UI
- Desktop: Electron
- Backend: ASP.NET Core (`net8.0`) with layered projects (`Core`, `Application`, `Infrastructure`, `ArasBackend`)
- Integration: Aras.IOM 15.0.1

## Build and Packaging

- Dev startup uses `dev-runner.js` plus prebuild of backend and preload.
- Distribution uses Electron Builder and bundles published backend under `extraResources/backend`.
- Backend publish target is self-contained `win-x64` single-file executable.

## Notable Implementation Notes

- Renderer forces dark mode by adding `dark` class to `document.documentElement`.
- `settings.json` is stored under Electron `userData/Settings`.
- `useSessionStore` persists only `savedSessions` to local storage (`aras-session-store`).

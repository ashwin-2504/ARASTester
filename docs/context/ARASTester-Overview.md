# ARAS Tester - Project Knowledge Base

> **Purpose**: This document serves as a starting point for understanding the ARASTester project architecture for both human developers and AI models.

---

## Project Overview

ARASTester is an **Electron-based desktop application** for testing Aras Innovator PLM (Product Lifecycle Management) systems. It consists of:

1. **Frontend (Renderer)** - React-based UI running in Electron's renderer process
2. **Backend (ArasBackend)** - .NET Core Web API that proxies requests to Aras Innovator

---

## Frontend Subsystems (`renderer/`)

### 1. **Core** (`core/`)

The architectural foundation containing adapters, services, and registries.

| Module                      | Purpose                                                          |
| --------------------------- | ---------------------------------------------------------------- |
| `adapters/TestPlanAdapter`  | Handles loading/saving test plan files via IPC                   |
| `adapters/StorageService`   | File system abstraction for persistent storage                   |
| `registries/ActionRegistry` | Registry of available test actions (Query, Create, Update, etc.) |
| `api/client`                | HTTP client wrapper for backend API calls                        |
| `ipc/appSettings`           | Electron IPC bridge for app settings (test plans folder path)    |
| `schemas/`                  | Validation schemas for test plans and actions                    |
| `services/`                 | Business logic services                                          |

---

### 2. **Components** (`components/`)

Reusable UI components organized by feature domain.

| Folder     | Purpose                                                 |
| ---------- | ------------------------------------------------------- |
| `ui/`      | Base UI primitives (Button, Input, Dialog, Toast, etc.) |
| `layout/`  | Page layout components (ActivityBar, Panels)            |
| `session/` | Session management UI (ProfileCard, connection dialogs) |
| `schema/`  | Schema browser components for Aras ItemTypes            |
| `plan/`    | Test plan display/editing components                    |
| `tree/`    | Tree view components for hierarchical data              |

**Key Components**:

- `BackendStatus.tsx` - Displays backend connection status
- `JsonViewer.tsx` - Pretty-prints JSON responses
- `TestTree.tsx` - Hierarchical test case tree navigator

---

### 3. **Stores** (`stores/`)

Global state management using Zustand.

| Store               | Purpose                                                                |
| ------------------- | ---------------------------------------------------------------------- |
| `useSessionStore`   | Manages Aras sessions (login, logout, active sessions, saved profiles) |
| `usePlanCacheStore` | Caches loaded test plans for performance                               |
| `useUiStore`        | UI state (panel visibility, themes)                                    |

---

### 4. **Routes** (`routes/`)

Page-level components for navigation.

| Route          | Purpose                                         |
| -------------- | ----------------------------------------------- |
| `Dashboard/`   | Home page with test plan list and quick actions |
| `PlanDetails/` | Test plan viewer/editor with action tree        |
| `Settings/`    | Application configuration                       |

---

### 5. **Types** (`types/`)

TypeScript type definitions for shared interfaces.

---

### 6. **Layouts** (`layouts/`)

Application shell layouts (sidebar, header, content areas).

---

## Backend Subsystems (`backend/ArasBackend/`)

The backend follows **Clean Architecture** principles with clear separation between presentation, application, and infrastructure layers.

### 1. **Controllers** (`Controllers/`)

REST API endpoints.

| Controller             | Purpose                             |
| ---------------------- | ----------------------------------- |
| `ConnectionController` | Manages Aras session lifecycle      |
| `ItemController`       | Proxies all Item operations to Aras |

**ConnectionController Endpoints**:

- `POST /api/aras/connect` - Authenticate with Aras
- `POST /api/aras/disconnect` - Logout current session
- `POST /api/aras/disconnect/{sessionName}` - Logout specific session
- `GET /api/aras/sessions` - List all active sessions
- `GET /api/aras/connection-status` - Check connection health
- `GET /api/aras/validate` - Validate current session

**ItemController Operations**:

- **CRUD**: Query, GetById, Create, Update, Delete, Purge
- **Locking**: Lock, Unlock, CheckLock
- **State**: Promote, GetState
- **Relationships**: AddRelationship, GetRelationships, DeleteRelationship
- **Advanced**: ApplyAml, ApplySql, ApplyMethod
- **Assertions**: AssertExists, AssertProperty, AssertState, AssertCount
- **Workflow**: StartWorkflow, GetAssignedActivities, CompleteActivity
- **Files**: UploadFile, DownloadFile, VerifyFileExists
- **Utilities**: GenerateId, GetNextSequence, Wait, SetVariable, LogMessage

---

### 2. **Services** (`Services/`)

Business logic and infrastructure services.

| Service             | Purpose                                                        |
| ------------------- | -------------------------------------------------------------- |
| `WebSessionContext` | Extracts session context from HTTP requests (cookies, headers) |

---

### 3. **Middleware** (`Middleware/`)

Cross-cutting concerns.

| Middleware                    | Purpose                                                   |
| ----------------------------- | --------------------------------------------------------- |
| `ArasAuthorizeAttribute`      | Authorization filter ensuring valid Aras session          |
| `ExceptionHandlingMiddleware` | Global exception handling with structured error responses |

---

### 4. **Program.cs** (Entry Point)

Application startup configuration:

- **CORS**: Dynamic origin validation (localhost in dev, strict in production)
- **Dependency Injection**: Registers services via `AddInfrastructure()` and `AddApplication()`
- **Middleware Pipeline**: Exception handling → CORS → Controllers
- **Health Check**: `/api/status` endpoint

---

## Architecture Diagram

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                                    ELECTRON APP                                       │
│                                                                                       │
│  ┌─────────────────────────────────────────┐    ┌──────────────────────────────────┐  │
│  │          RENDERER PROCESS               │    │         MAIN PROCESS             │  │
│  │                                         │    │                                  │  │
│  │  ┌─────────────────────────────────┐    │    │  ┌────────────────────────────┐  │  │
│  │  │        React Components         │    │    │  │       main.js              │  │  │
│  │  │  ┌──────────┐ ┌──────────────┐  │    │    │  │  • Window management       │  │  │
│  │  │  │ routes/  │ │ components/  │  │    │    │  │  • App lifecycle           │  │  │
│  │  │  │Dashboard │ │  ui/         │  │    │    │  │  • IPC handlers (fs:*)     │  │  │
│  │  │  │PlanDtls  │ │  session/    │  │    │    │  └────────────────────────────┘  │  │
│  │  │  │Settings  │ │  schema/     │  │    │    │               │                   │  │
│  │  │  └──────────┘ └──────────────┘  │    │    │  ┌────────────▼───────────────┐  │  │
│  │  └───────────────┬─────────────────┘    │    │  │       preload.js           │  │  │
│  │                  │                      │    │  │  • contextBridge API       │  │  │
│  │  ┌───────────────▼─────────────────┐    │    │  │  • Secure IPC exposure     │  │  │
│  │  │         Zustand Stores          │    │    │  └────────────────────────────┘  │  │
│  │  │  useSessionStore                │    │    │               │                   │  │
│  │  │  usePlanCacheStore              │    │    └───────────────┼───────────────────┘  │
│  │  │  useUiStore                     │    │                    │                      │
│  │  └───────────────┬─────────────────┘    │                    ▼                      │
│  │                  │                      │    ┌──────────────────────────────────┐  │
│  │  ┌───────────────▼─────────────────┐    │    │         FILE SYSTEM              │  │
│  │  │           Core Layer            │◄───┼────┤  • Test Plans (JSON)             │  │
│  │  │  ┌──────────────────────────┐   │ IPC│    │  • App Settings                  │  │
│  │  │  │ adapters/                │   │    │    └──────────────────────────────────┘  │
│  │  │  │   TestPlanAdapter        │   │    │                                         │
│  │  │  │   StorageService         │   │    │                                         │
│  │  │  ├──────────────────────────┤   │    │                                         │
│  │  │  │ api/client               │───┼────┼─────────────────┐                       │
│  │  │  ├──────────────────────────┤   │    │                 │                       │
│  │  │  │ registries/ActionRegistry│   │    │                 │                       │
│  │  │  └──────────────────────────┘   │    │                 │ HTTP                  │
│  │  └─────────────────────────────────┘    │                 │ (localhost:5543)      │
│  │                                         │                 │                       │
│  └─────────────────────────────────────────┘                 │                       │
│                                                              │                       │
└──────────────────────────────────────────────────────────────┼───────────────────────┘
                                                               │
┌──────────────────────────────────────────────────────────────▼───────────────────────┐
│                           .NET BACKEND (Clean Architecture)                          │
│                                                                                       │
│  ┌─────────────────────────────────────────────────────────────────────────────────┐  │
│  │  PRESENTATION LAYER (ArasBackend/)                                              │  │
│  │  ┌──────────────────────────┐  ┌───────────────────────────────────────────┐    │  │
│  │  │      Controllers/        │  │              Middleware/                  │    │  │
│  │  │  • ConnectionController  │  │  • ExceptionHandlingMiddleware            │    │  │
│  │  │  • ItemController        │  │  • ArasAuthorizeAttribute                 │    │  │
│  │  └──────────────────────────┘  └───────────────────────────────────────────┘    │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  Program.cs: CORS, DI Registration, Middleware Pipeline                  │   │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────┬─────────────────────────────────────┘  │
│                                              │                                        │
│  ┌───────────────────────────────────────────▼─────────────────────────────────────┐  │
│  │  APPLICATION LAYER (ArasBackend.Application/)                                   │  │
│  │  ┌──────────────────────────────────────────────────────────────────────────┐   │  │
│  │  │  Services/                           │  Interfaces/                      │   │  │
│  │  │  • ConnectionAppService              │  • ISessionContext                │   │  │
│  │  │  • ItemAppService                    │                                   │   │  │
│  │  └──────────────────────────────────────────────────────────────────────────┘   │  │
│  └───────────────────────────────────────────┬─────────────────────────────────────┘  │
│                                              │                                        │
│  ┌───────────────────────────────────────────▼─────────────────────────────────────┐  │
│  │  CORE LAYER (ArasBackend.Core/)                                                 │  │
│  │  ┌────────────────────┐  ┌─────────────────────┐  ┌──────────────────────────┐  │  │
│  │  │  Models/           │  │  Interfaces/        │  │  Exceptions/             │  │  │
│  │  │  • DTOs            │  │  • IArasGateway     │  │  • Domain exceptions     │  │  │
│  │  │  • Request/Resp    │  │                     │  │                          │  │  │
│  │  └────────────────────┘  └─────────────────────┘  └──────────────────────────┘  │  │
│  └─────────────────────────────────────────────────────────────────────────────────┘  │
│                                              │                                        │
│  ┌───────────────────────────────────────────▼─────────────────────────────────────┐  │
│  │  INFRASTRUCTURE LAYER (ArasBackend.Infrastructure/)                             │  │
│  │  ┌──────────────────────────────────────┐  ┌────────────────────────────────┐   │  │
│  │  │  Gateways/                           │  │  Services/                     │   │  │
│  │  │  • ArasGateway (IOM SDK wrapper)     │  │  • ArasSessionManager          │   │  │
│  │  │    - ApplyAml, ApplySql, ApplyMethod │  │  • InMemoryConnectionStore     │   │  │
│  │  │    - CRUD, Lock, Promote, Workflow   │  │  • ConnectionStore             │   │  │
│  │  └──────────────────────────────────────┘  └────────────────────────────────┘   │  │
│  └───────────────────────────────────────────┬─────────────────────────────────────┘  │
│                                              │                                        │
└──────────────────────────────────────────────┼────────────────────────────────────────┘
                                               │ Aras IOM SDK
                                               ▼
                                ┌──────────────────────────────┐
                                │     ARAS INNOVATOR SERVER    │
                                │   (PLM System via HTTP/IOM)  │
                                └──────────────────────────────┘
```

---

## Internal Flow Diagrams

### 1. Frontend Data Flow

```
┌─────────────────────────────────────────────────────────────────────────────────────┐
│                            FRONTEND DATA FLOW                                        │
│                                                                                      │
│   User Interaction                                                                   │
│        │                                                                             │
│        ▼                                                                             │
│   ┌─────────────────┐                                                                │
│   │  React Component │  (e.g., ProfileCard, PlanDetailsPage)                         │
│   │  routes/ or      │                                                               │
│   │  components/     │                                                               │
│   └────────┬────────┘                                                                │
│            │ calls hook                                                              │
│            ▼                                                                         │
│   ┌─────────────────────────────────────────────────────────┐                        │
│   │                    Zustand Store                         │                        │
│   │  ┌─────────────────┐  ┌─────────────────┐  ┌──────────┐ │                        │
│   │  │useSessionStore  │  │usePlanCacheStore│  │useUiStore│ │                        │
│   │  │ • login()       │  │ • getPlan()     │  │• panels  │ │                        │
│   │  │ • logout()      │  │ • invalidate()  │  │• theme   │ │                        │
│   │  │ • fetchSessions │  │ • cache Map     │  │          │ │                        │
│   │  └────────┬────────┘  └────────┬────────┘  └──────────┘ │                        │
│   └───────────┼────────────────────┼────────────────────────┘                        │
│               │                    │                                                  │
│       ┌───────┴───────┐    ┌───────┴───────┐                                         │
│       │ HTTP via      │    │ IPC via       │                                         │
│       │ api/client    │    │ adapters/     │                                         │
│       ▼               │    ▼               │                                         │
│  ┌────────────────┐   │   ┌────────────────┐                                         │
│  │  apiClient     │   │   │TestPlanAdapter │                                         │
│  │ • post<T>()    │   │   │StorageService  │                                         │
│  │ • get<T>()     │   │   └───────┬────────┘                                         │
│  │ • cancelAll()  │   │           │                                                  │
│  │ • retry logic  │   │           │ window.api.* (preload)                           │
│  └───────┬────────┘   │           ▼                                                  │
│          │            │   ┌────────────────┐                                         │
│          │ HTTP       │   │  main.js IPC   │──────► File System                      │
│          │            │   │  fs:readFile   │        (JSON files)                     │
│          ▼            │   │  fs:writeFile  │                                         │
│  ┌────────────────┐   │   └────────────────┘                                         │
│  │ .NET Backend   │   │                                                              │
│  │ localhost:5543 │   │                                                              │
│  └────────────────┘   │                                                              │
└───────────────────────┴──────────────────────────────────────────────────────────────┘
```

---

### 2. Backend Request Processing Pipeline

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                      BACKEND REQUEST PROCESSING PIPELINE                              │
│                                                                                       │
│   HTTP Request (from apiClient)                                                       │
│        │                                                                              │
│        ▼                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────────┐       │
│   │  ASP.NET Core Pipeline (Program.cs)                                      │       │
│   │  ┌────────────────────────────────────────────────────────────────────┐  │       │
│   │  │ 1. CORS Middleware                                                 │  │       │
│   │  │    • Dev: Allow any localhost origin                               │  │       │
│   │  │    • Prod: Strict origin allowlist from appsettings.json           │  │       │
│   │  └───────────────────────────────┬────────────────────────────────────┘  │       │
│   │                                  ▼                                        │       │
│   │  ┌────────────────────────────────────────────────────────────────────┐  │       │
│   │  │ 2. ExceptionHandlingMiddleware                                     │  │       │
│   │  │    • Catches all exceptions                                        │  │       │
│   │  │    • Maps to structured JSON error responses                       │  │       │
│   │  │    • ArasOperationException → 400 Bad Request                      │  │       │
│   │  │    • Exception → 500 Internal Server Error                         │  │       │
│   │  └───────────────────────────────┬────────────────────────────────────┘  │       │
│   │                                  ▼                                        │       │
│   │  ┌────────────────────────────────────────────────────────────────────┐  │       │
│   │  │ 3. Controller Action                                               │  │       │
│   │  │    • ConnectionController.Connect()                                │  │       │
│   │  │    • ItemController.Query()                                        │  │       │
│   │  │    • [ArasAuthorize] filter validates session                      │  │       │
│   │  └───────────────────────────────┬────────────────────────────────────┘  │       │
│   └──────────────────────────────────┼────────────────────────────────────────┘       │
│                                      ▼                                                │
│   ┌──────────────────────────────────────────────────────────────────────────┐       │
│   │  Application Layer (ArasBackend.Application/)                            │       │
│   │  ┌──────────────────────────────────────────────────────────────────┐    │       │
│   │  │ ConnectionAppService           │ ItemAppService                  │    │       │
│   │  │ • Connect() → delegates to     │ • Query() → delegates to       │    │       │
│   │  │   IArasSessionManager          │   IArasGateway                  │    │       │
│   │  │ • Thin orchestration layer     │ • Request → Operation → Result │    │       │
│   │  └──────────────────────────────────────────────────────────────────┘    │       │
│   └──────────────────────────────────┬───────────────────────────────────────┘       │
│                                      ▼                                                │
│   ┌──────────────────────────────────────────────────────────────────────────┐       │
│   │  Infrastructure Layer (ArasBackend.Infrastructure/)                      │       │
│   │  ┌───────────────────────────────┐ ┌─────────────────────────────────┐   │       │
│   │  │ ArasSessionManager            │ │ ArasGateway                     │   │       │
│   │  │ • Connect: create Innovator   │ │ • ExecuteIom<T>() wrapper       │   │       │
│   │  │ • Store session in            │ │ • QueryItems, CreateItem, etc.  │   │       │
│   │  │   InMemoryConnectionStore     │ │ • Translates to Aras.IOM calls  │   │       │
│   │  │ • Manage cookie mapping       │ │ • Task.Run for async execution  │   │       │
│   │  └───────────────────────────────┘ └─────────────────────────────────┘   │       │
│   └──────────────────────────────────┬───────────────────────────────────────┘       │
│                                      ▼                                                │
│                           ┌───────────────────────┐                                  │
│                           │   Aras.IOM SDK        │                                  │
│                           │   (Innovator object)  │                                  │
│                           └───────────┬───────────┘                                  │
│                                       ▼                                               │
│                           ┌───────────────────────┐                                  │
│                           │  Aras Innovator       │                                  │
│                           │  (HTTP/SOAP)          │                                  │
│                           └───────────────────────┘                                  │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 3. Test Plan Loading Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           TEST PLAN LOADING FLOW                                      │
│                                                                                       │
│   Dashboard.tsx loads                                                                 │
│        │                                                                              │
│        ▼                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐                 │
│   │ 1. Check usePlanCacheStore                                      │                 │
│   │    • If cache valid → return cached plans                       │                 │
│   │    • If stale/empty → continue                                  │                 │
│   └─────────────────────────────────────────────────────────────────┘                 │
│        │                                                                              │
│        ▼                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐                 │
│   │ 2. TestPlanAdapter.loadAllPlans()                               │                 │
│   │    • getFolderPath() → IPC to get test plans folder             │                 │
│   │    • StorageService.listJsonFiles(folder)                       │                 │
│   └─────────────────────────────────────────────────────────────────┘                 │
│        │                                                                              │
│        ▼                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐                 │
│   │ 3. Concurrent file loading (mapConcurrent, limit=20)            │                 │
│   │    For each .json file:                                         │                 │
│   │    ├─► StorageService.readFile(folder, filename)                │                 │
│   │    │   └─► window.api.readFile(baseDir, relativePath)           │                 │
│   │    │       └─► main.js fs:readFile handler                      │                 │
│   │    │           └─► Path validation (resolveSafePath)            │                 │
│   │    │               └─► fs.readFileSync(fullPath)                │                 │
│   │    │                                                            │                 │
│   │    ├─► JSON.parse(raw) — skip invalid files                     │                 │
│   │    └─► Attach __id, __filename metadata                         │                 │
│   └─────────────────────────────────────────────────────────────────┘                 │
│        │                                                                              │
│        ▼                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐                 │
│   │ 4. Sort by updated/created date (descending)                    │                 │
│   │    • Store in usePlanCacheStore                                 │                 │
│   │    • Return TestPlan[] to component                             │                 │
│   └─────────────────────────────────────────────────────────────────┘                 │
│        │                                                                              │
│        ▼                                                                              │
│   ┌─────────────────────────────────────────────────────────────────┐                 │
│   │ 5. Dashboard renders TestTree with plan hierarchy               │                 │
│   │    • User clicks plan → navigate to PlanDetails                 │                 │
│   │    • PlanDetails loads full plan via getPlan(filename)          │                 │
│   └─────────────────────────────────────────────────────────────────┘                 │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 4. Session Connection Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           SESSION CONNECTION FLOW                                     │
│                                                                                       │
│   User clicks "Connect" on ProfileCard                                                │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 1. ProfileCard.handleConnect()                     │                              │
│   │    • Collect credentials (url, database, user, pw) │                              │
│   │    • Generate sessionName from profile             │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 2. useSessionStore.login(credentials)              │                              │
│   │    • Add to connectingSessions Set (for UI state)  │                              │
│   │    • set({ isLoading: true })                      │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 3. apiClient.post("/api/aras/connect", credentials)│                              │
│   │    • Headers: Content-Type: application/json       │                              │
│   │    • credentials: "include" for cookies            │                              │
│   │    • Retry logic (5 retries, exponential backoff)  │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │  HTTP POST                                                                   │
│        ▼                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────────┐       │
│   │ 4. ConnectionController.Connect(request)                                 │       │
│   │    └─► ConnectionAppService.Connect(request)                             │       │
│   │        └─► ArasSessionManager.Connect(request)                           │       │
│   │            ├─► Create Aras.IOM.Innovator instance                        │       │
│   │            │   Innovator.GetInnovator(innovator_url, database, user, pw) │       │
│   │            ├─► Store in InMemoryConnectionStore[sessionName]             │       │
│   │            └─► Return ConnectionResponse { success, serverInfo }         │       │
│   └──────────────────────────────────────────────────────────────────────────┘       │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 5. Controller sets ARAS_SESSION_ID cookie          │                              │
│   │    Response.Cookies.Append("ARAS_SESSION_ID",      │                              │
│   │      sessionName, { HttpOnly, Secure, SameSite })  │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 6. Frontend receives response                      │                              │
│   │    • normalizeResponse (PascalCase → camelCase)    │                              │
│   │    • fetchSessions() to refresh active sessions    │                              │
│   │    • Update lastAccessedAt on saved session        │                              │
│   │    • Clear connectingSessions Set                  │                              │
│   │    • UI updates: ProfileCard shows "Connected"     │                              │
│   └────────────────────────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

### 5. Test Action Execution Flow

```
┌──────────────────────────────────────────────────────────────────────────────────────┐
│                           TEST ACTION EXECUTION FLOW                                  │
│                                                                                       │
│   User clicks "Execute" on a test action (e.g., Query)                                │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 1. ActionRegistry.get(action.type)                 │                              │
│   │    • Returns action definition + executor          │                              │
│   │    • Validates action parameters against schema    │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 2. Build API request from action parameters        │                              │
│   │    { itemType, aml, where, select, ... }           │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 3. apiClient.post("/api/item/query", request)      │                              │
│   │    • Session passed via cookie (ARAS_SESSION_ID)   │                              │
│   │    • Or via X-Session-Name header                  │                              │
│   └────────────────────────────────────────────────────┘                              │
│        │  HTTP POST                                                                   │
│        ▼                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────────┐       │
│   │ 4. Backend Processing                                                    │       │
│   │    ┌────────────────────────────────────────────────────────────────┐    │       │
│   │    │ ItemController.Query(request)                                  │    │       │
│   │    │   └─► [ArasAuthorize] validates session from cookie/header    │    │       │
│   │    │       └─► WebSessionContext extracts session name             │    │       │
│   │    │           └─► InMemoryConnectionStore.Get(sessionName)        │    │       │
│   │    └────────────────────────────────────────────────────────────────┘    │       │
│   │                           │                                              │       │
│   │                           ▼                                              │       │
│   │    ┌────────────────────────────────────────────────────────────────┐    │       │
│   │    │ ItemAppService.Query(request)                                  │    │       │
│   │    │   └─► IArasGateway.QueryItems(itemType, aml)                   │    │       │
│   │    │       └─► ArasGateway.ExecuteIom(inn => ...)                   │    │       │
│   │    │           └─► inn.applyAML(aml) via Aras.IOM SDK              │    │       │
│   │    └────────────────────────────────────────────────────────────────┘    │       │
│   │                           │                                              │       │
│   │                           ▼                                              │       │
│   │    ┌────────────────────────────────────────────────────────────────┐    │       │
│   │    │ Result Processing                                              │    │       │
│   │    │   • Parse IOM Item result                                      │    │       │
│   │    │   • Check for errors (item.isError())                          │    │       │
│   │    │   • Convert to JSON-serializable response                      │    │       │
│   │    │   • Return QueryResponse { success, items, count }             │    │       │
│   │    └────────────────────────────────────────────────────────────────┘    │       │
│   └──────────────────────────────────────────────────────────────────────────┘       │
│        │                                                                              │
│        ▼                                                                              │
│   ┌────────────────────────────────────────────────────┐                              │
│   │ 5. Frontend displays result                        │                              │
│   │    • JsonViewer shows response data                │                              │
│   │    • Update action status (pass/fail)              │                              │
│   │    • Log execution in test run history             │                              │
│   └────────────────────────────────────────────────────┘                              │
└──────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Key Concepts

### Session Management

- Backend maintains **named sessions** allowing multiple simultaneous Aras connections
- Session ID stored in `ARAS_SESSION_ID` cookie
- Frontend tracks `connectingSessions` to handle parallel connection attempts

### Test Plans

- Stored as JSON files in configurable folder
- Loaded/saved via Electron IPC (`fs:readFile`, `fs:writeFile`)
- Cached in `usePlanCacheStore` for performance

### Action Registry

- Defines available test operations (Query, Create, Assert, etc.)
- Each action has schema, executor, and UI component
- Used by test plan editor for action selection

---

## File Conventions

| Pattern          | Meaning                     |
| ---------------- | --------------------------- |
| `*.tsx`          | React component with JSX    |
| `*.ts`           | TypeScript module           |
| `use*.ts`        | React hook or Zustand store |
| `*Adapter.ts`    | External system adapter     |
| `*Service.ts`    | Business logic service      |
| `*Controller.cs` | REST API controller         |
| `*Middleware.cs` | HTTP pipeline middleware    |

---

_Last Updated: February 2026_

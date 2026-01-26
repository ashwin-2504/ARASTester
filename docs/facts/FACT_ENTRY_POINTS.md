# FACT_ENTRY_POINTS

**Source**: Discovered files matching `main.*`, `Program.cs`, `index.html`
**Extraction Date**: 2026-01-20
**Constraint**: Entry file paths and explicitly declared runtime configuration values. No inferred behavior.

---

## Electron Entry Point

### File: `main.js`
**Path**: `c:\Projects\ARASTester\main.js`
**Role**: Electron main process entry (declared in `package.json` as `"main": "main.js"`)

**Explicit Configuration Values**:
| Configuration | Value | Line |
|---------------|-------|------|
| Window Width | 1200 | 11 |
| Window Height | 800 | 12 |
| Context Isolation | true | 16 |
| Node Integration | false | 17 |
| Dev Mode URL | http://localhost:5173 | 26 |
| Production Load File | dist/index.html | 31 |
| Backend Startup Delay | 1500ms | 96 |
| Backend URL (arg) | http://localhost:5000 | 68 |
| Backend Exe (Dev) | backend/ArasBackend/bin/Debug/net8.0/win-x64/ArasBackend.exe | 48 |
| Backend Exe (Prod) | {resourcesPath}/backend/ArasBackend.exe | 46 |

**Electron APIs Used** (explicitly imported, line 2):
- `app`
- `BrowserWindow`
- `ipcMain`
- `dialog`
- `Menu`

**IPC Handlers Registered**:
| Channel | Line |
|---------|------|
| dialog:pickFolder | 108 |
| fs:readFile | 117 |
| fs:writeFile | 121 |
| fs:listJsonFiles | 126 |
| fs:deleteFile | 134 |
| settings:read | 142 |
| settings:write | 153 |

---

## HTML Entry Point

### File: `index.html`
**Path**: `c:\Projects\ARASTester\index.html`

**Explicit Configuration**:
| Configuration | Value | Line |
|---------------|-------|------|
| Title | Test Plan Dashboard | 12 |
| Root Element ID | root | 21 |
| Entry Script | /renderer/app/main.jsx | 22 |
| CSP script-src | 'self' | 9 |

---

## React Entry Point

### File: `renderer/app/main.jsx`
**Path**: `c:\Projects\ARASTester\renderer\app\main.jsx`

**Imports**:
| Import | Line |
|--------|------|
| React | 1 |
| ReactDOM | 2 |
| App (from ./App) | 3 |
| ../globals.css | 4 |

**Root Render Target**: `document.getElementById('root')` (line 12)

---

## Backend Entry Point

### File: `backend/ArasBackend/Program.cs`
**Path**: `c:\Projects\ARASTester\backend\ArasBackend\Program.cs`

**Explicit Configuration Values**:
| Configuration | Value | Line |
|---------------|-------|------|
| CORS Origins | http://localhost:3000, http://localhost:5173 | 14 |
| CORS Credentials | Allowed | 18 |
| CORS Methods | Any | 17 |
| CORS Headers | Any | 16 |
| Status Endpoint | /api/status | 39 |

**Services Registered**:
| Service | Method | Line |
|---------|--------|------|
| CORS | AddCors | 9 |
| Infrastructure | AddInfrastructure() | 23 |
| Application | AddApplication() | 24 |
| Controllers | AddControllers() | 25 |

**Middleware Used**:
| Middleware | Line |
|------------|------|
| ExceptionHandlingMiddleware | 29 |
| HTTPS Redirection (non-dev) | 33 |
| CORS (AllowLocalhost) | 36 |

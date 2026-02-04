# FACT_ENTRY_POINTS

**Source**: Discovered files matching `main.*`, `Program.cs`, `index.html`
**Extraction Date**: 2026-01-20
**Constraint**: Entry file paths and explicitly declared runtime configuration values. No inferred behavior.

---

## Tauri Entry Point

### File: `src-tauri/src/main.rs`
**Path**: `c:\Projects\ARASTester\src-tauri\src\main.rs`
**Role**: Tauri core entrypoint (builder and sidecar launcher)

**Explicit Configuration Values**:
| Configuration | Value | Line |
|---------------|-------|------|
| Window Width | 1200 | tauri.conf.json |
| Window Height | 800 | tauri.conf.json |
| Dev Mode URL | http://localhost:5173 | tauri.conf.json |
| Production Load Dir | dist | tauri.conf.json |
| Backend URL (arg) | http://localhost:5000 | main.rs |
| Backend Sidecar | backend/ArasBackend | tauri.conf.json |

**Tauri APIs Used**:
- `tauri::Builder`
- `tauri::api::process::Command`
- `#[tauri::command]` handlers (see commands.rs)

**Command Handlers Registered**:
| Command | Notes |
|---------|------|
| pick_folder | Folder selection + allowlist |
| read_file | Safe file read |
| write_file | Safe file write |
| list_json_files | JSON list |
| delete_file | Safe file delete |
| settings_read | Settings read |
| settings_write | Settings write |

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
| @/core/ipc/tauriBridge | 5 |

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

# 08_TAURI_MIGRATION_REPORT

**Purpose**: Provide a migration report for moving the current Electron-based desktop shell to Tauri, with references to the existing codebase and a staged migration plan.

---

## 1. Current Electron Responsibilities (Code-Based)

### 1.1 Desktop Shell & Window Bootstrapping

- Electron’s main process creates the app window, loads Vite dev server in development, and serves `dist/index.html` in production. This is controlled by `main.js` and the `"main": "main.js"` entry in `package.json`. The app uses `contextIsolation: true` and `nodeIntegration: false` with a preload bridge. 【F:main.js†L91-L139】【F:package.json†L7-L20】
- The app removes the default menu and sets a background color on the window. 【F:main.js†L4-L5】【F:main.js†L93-L106】

### 1.2 Backend Process Launch

- The Electron main process spawns a bundled .NET 8 backend EXE (development path under `backend/ArasBackend/bin/Debug/net8.0/win-x64`, production path under `process.resourcesPath`). The backend is started with `--urls http://localhost:${port}` on port 5000 by default. 【F:main.js†L141-L214】
- The Electron packager configuration includes the backend publish output in `dist-backend` as an extra resource and includes `main.js`, `preload.js`, and `dist/**` in the final desktop build. 【F:package.json†L24-L63】

### 1.3 IPC & Filesystem Mediation

- The renderer accesses filesystem operations via `window.api` exposed by the preload script, which proxies to Electron IPC handlers. These include file read/write, JSON listing, delete, and a folder picker. 【F:preload.ts†L1-L23】
- The main process implements IPC handlers for filesystem operations, plus settings read/write, and enforces path restrictions via `resolveSafePath` and an `authorizedDirs` allowlist. 【F:main.js†L241-L369】

### 1.4 Security Controls in Electron

- Electron is configured to keep the renderer isolated (`contextIsolation: true`) and prevent node access (`nodeIntegration: false`). 【F:main.js†L93-L103】
- The codebase documents Electron security settings in the security report. 【F:docs/06_SECURITY_AND_FAILURES.md†L32-L40】

---

## 2. Migration Targets for Tauri (What Must Be Replaced)

The Electron responsibilities above map cleanly to Tauri equivalents:

| Electron Responsibility | Current Implementation | Tauri Migration Target |
| --- | --- | --- |
| Window creation & dev/prod URL loading | `BrowserWindow` in `main.js` | `tauri.conf.json` + `tauri::Builder` window config |
| IPC bridge | `preload.ts` with `contextBridge` | `tauri::invoke` + `#[tauri::command]` APIs |
| Local filesystem access | IPC handlers in `main.js` | Tauri `fs` APIs or custom Rust commands with allowlist enforcement |
| Backend process spawn | `child_process.spawn` in `main.js` | Tauri sidecar management or Rust `std::process::Command` |
| Packaging | `electron-builder` config | Tauri bundler (NSIS / MSI on Windows) |

---

## 3. Current Migration Status (Repository Changes)

The repository now includes an initial Tauri scaffold so that the desktop shell can begin migrating in parallel with Electron. The scaffold includes:

- `src-tauri/Cargo.toml` and `src-tauri/build.rs` for the Rust entrypoint and build setup.
- `src-tauri/src/main.rs` with a minimal Tauri `Builder`.
- `src-tauri/src/commands.rs` with a placeholder `ping` command.
- `src-tauri/tauri.conf.json` configured for the Vite dev server and build output. 【F:src-tauri/Cargo.toml†L1-L18】【F:src-tauri/build.rs†L1-L3】【F:src-tauri/src/main.rs†L1-L10】【F:src-tauri/src/commands.rs†L1-L4】【F:src-tauri/tauri.conf.json†L1-L40】

---

## 4. Tauri Scaffold Mapping (Concrete File Targets)

When introducing Tauri, the following project areas become the new “desktop shell” owners:

| Concern | Current Location | Tauri Location (Target) |
| --- | --- | --- |
| Shell entrypoint | `main.js` | `src-tauri/src/main.rs` |
| IPC definition | `preload.ts` + `ipcMain.handle` | `src-tauri/src/commands.rs` + `#[tauri::command]` |
| Runtime config | `package.json` (`main`, `build`) | `src-tauri/tauri.conf.json` |
| Backend resource bundle | `build.extraResources` | `tauri.conf.json` `bundle.resources` |

This mapping is intended to preserve existing behaviors: window config and dev/prod URL switching from `main.js`, filesystem handling via `preload.ts`, and backend packaging via `package.json`’s `build` section. 【F:main.js†L91-L214】【F:preload.ts†L1-L23】【F:package.json†L7-L63】

---

## 5. Proposed Migration Plan (Phased)

### Phase 0 — Alignment & Inventory

1. **Confirm native target matrix** (Windows-only vs. multi-platform). Today the repo is Windows-focused (Electron backend EXE path and Electron builder config for NSIS). 【F:main.js†L141-L176】【F:package.json†L47-L63】
2. **Document IPC surface area** (the `window.api` methods listed below) and validate all usages in the renderer.
   - `pickFolder`, `readFile`, `writeFile`, `listJsonFiles`, `deleteFile`, `settings.read`, `settings.write`. 【F:preload.ts†L8-L23】

### Phase 1 — Introduce Tauri Shell in Parallel

1. **Add Tauri scaffold** (without removing Electron yet) and point it to the existing Vite build output (`dist/index.html`).
2. **Keep existing frontend build**. Vite is already used for the renderer; Tauri can serve the same compiled assets. 【F:package.json†L18-L23】
3. **Create Tauri commands mirroring current IPC**:
   - Build a `commands.rs` layer that maps 1:1 with the Electron IPC handlers and preserves the `authorizedDirs`/`resolveSafePath` semantics.

### Phase 2 — Replace IPC Bridge

1. **Swap `window.api` calls** to Tauri `invoke` calls in the renderer.
2. **Retain the same API contract** to keep surface-level changes minimal (same method names and return types).
3. **Move settings storage** to Tauri’s path utilities (e.g., `app_data_dir`) while preserving the `Settings/settings.json` layout for compatibility. This mirrors the Electron behavior that uses `app.getPath("userData")`. 【F:main.js†L214-L233】【F:main.js†L341-L369】
4. **Add a compatibility wrapper** that keeps the `window.api` shape while internally routing to Tauri `invoke` (optional but minimizes churn). The current renderer expects `window.api` methods defined in `preload.ts`. 【F:preload.ts†L1-L23】

### Phase 3 — Backend Process & Packaging

1. **Sidecar backend**: bundle the .NET backend exe using Tauri “sidecar” definitions or spawn via Rust. This replaces the Electron `child_process.spawn` usage. 【F:main.js†L141-L214】
2. **Pass runtime port config** with environment variables or command args, preserving the current `BACKEND_PORT` default handling. 【F:main.js†L182-L206】
3. **Migrate packaging**:
   - Replace `electron-builder` configuration with `tauri.conf.json` bundling settings.
   - Ensure `dist-backend` artifacts are included in the Tauri bundle (similar to `extraResources` today). 【F:package.json†L24-L63】

### Phase 4 — Decommission Electron

1. Remove Electron dependencies (`electron`, `electron-builder`) and `main.js`/`preload.js` from the build pipeline.
2. Retire Electron-specific scripts (`dev:electron`, `dist`) and add new Tauri equivalents.
3. Update documentation and system diagrams to reflect the Tauri shell.

---

## 6. Technical Gaps & Risks

1. **Filesystem security parity**: The current Electron implementation uses `resolveSafePath` and an `authorizedDirs` allowlist to reduce traversal and scope access. This logic must be replicated in Rust commands to avoid regressions. 【F:main.js†L241-L320】
2. **Backend lifecycle**: The backend currently starts automatically when the Electron app launches and is killed on `app.will-quit`. Equivalent lifecycle hooks are required in Tauri to avoid orphaned processes. 【F:main.js†L214-L240】
3. **Dev workflows**: Electron dev mode expects a Vite server (`http://localhost:5173`) and opens DevTools. Tauri’s dev workflow should be aligned to avoid breaking existing frontend iteration. 【F:main.js†L108-L128】
4. **Permission model differences**: Electron’s IPC uses a custom `authorizedDirs` allowlist with manual checks. Tauri’s permissions model (allowlist + command permissions) needs to be explicitly configured to avoid widening access beyond the current Electron constraints. 【F:main.js†L241-L320】

---

## 7. Recommended Next Steps

1. **Create a Tauri spike branch** that scaffolds Tauri without removing Electron.
2. **Implement file I/O commands** in Rust with the same constraints as `resolveSafePath`.
3. **Bundle backend sidecar** and validate auto-start/stop behavior.
4. **Update documentation** once the sidecar and IPC parity are verified.
5. **Add a migration test plan** focused on file I/O, settings persistence, and backend startup so parity is validated in the same areas Electron currently owns. 【F:main.js†L141-L369】【F:preload.ts†L1-L23】

---

## 8. Migration Checklist (1:1 Surface Area)

- [ ] Window setup and dev/prod URL switching.
- [ ] IPC surface parity for `window.api` functions. 【F:preload.ts†L8-L23】
- [ ] Backend process spawn and environment parity. 【F:main.js†L141-L214】
- [ ] File system authorization logic ported. 【F:main.js†L241-L320】
- [ ] Packaging with backend resources. 【F:package.json†L24-L63】
- [ ] Permissions model mirrors Electron allowlist behavior. 【F:main.js†L241-L320】

---

## Appendix — Electron-specific Files To Retire After Migration

- `main.js` (Electron main process) 【F:main.js†L1-L369】
- `preload.ts` / `preload.js` (IPC bridge) 【F:preload.ts†L1-L23】
- Electron dependencies and scripts in `package.json` 【F:package.json†L18-L90】

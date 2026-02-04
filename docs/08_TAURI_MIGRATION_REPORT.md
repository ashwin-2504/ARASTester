# 08_TAURI_MIGRATION_REPORT

**Purpose**: Provide a migration report for moving the current Electron-based desktop shell to Tauri, with references to the existing codebase and a staged migration plan.

---

## 1. Former Electron Responsibilities (Historical Context)

### 1.1 Desktop Shell & Window Bootstrapping

- Electron’s main process created the app window, loaded the Vite dev server in development, and served `dist/index.html` in production. The app used `contextIsolation: true` and `nodeIntegration: false` with a preload bridge.
- The app removed the default menu and set a background color on the window.

### 1.2 Backend Process Launch

- The Electron main process spawned a bundled .NET 8 backend EXE (development path under `backend/ArasBackend/bin/Debug/net8.0/win-x64`, production path under `process.resourcesPath`). The backend started with `--urls http://localhost:${port}` on port 5000 by default.
- The Electron packager configuration included the backend publish output in `dist-backend` as an extra resource and included Electron entrypoints in the final desktop build.

### 1.3 IPC & Filesystem Mediation

- The renderer accessed filesystem operations via `window.api` exposed by the preload script, which proxied to Electron IPC handlers. These included file read/write, JSON listing, delete, and a folder picker.
- The main process implemented IPC handlers for filesystem operations, plus settings read/write, and enforced path restrictions via `resolveSafePath` and an `authorizedDirs` allowlist.

### 1.4 Security Controls in Electron (Legacy)

- Electron was configured to keep the renderer isolated (`contextIsolation: true`) and prevent node access (`nodeIntegration: false`).
- The codebase documents Electron security settings in the security report.

---

## 2. Migration Targets for Tauri (What Must Be Replaced)

The Electron responsibilities above map cleanly to Tauri equivalents:

| Electron Responsibility | Legacy Implementation | Tauri Migration Target |
| --- | --- | --- |
| Window creation & dev/prod URL loading | Electron main process | `tauri.conf.json` + `tauri::Builder` window config |
| IPC bridge | Electron preload + IPC | `tauri::invoke` + `#[tauri::command]` APIs |
| Local filesystem access | Electron IPC handlers | Tauri `fs` APIs or custom Rust commands with allowlist enforcement |
| Backend process spawn | Electron process spawn | Tauri sidecar management or Rust `std::process::Command` |
| Packaging | Electron builder | Tauri bundler (NSIS / MSI on Windows) |

---

## 3. Current Migration Status (Repository Changes)

The repository now includes a Tauri scaffold, IPC parity commands, a renderer bridge, and a backend sidecar launcher. Electron entrypoints and scripts have been removed. The new pieces include:

- `src-tauri/Cargo.toml` and `src-tauri/build.rs` for the Rust entrypoint and build setup.
- `src-tauri/src/main.rs` with a Tauri `Builder` that registers command handlers and initializes an allowlist state.
- `src-tauri/src/commands.rs` with commands that map to the current Electron IPC surface area (`pick_folder`, file I/O, settings read/write).
- `renderer/core/ipc/tauriBridge.ts` to preserve the `window.api` contract in the renderer when running under Tauri. 【F:renderer/core/ipc/tauriBridge.ts†L1-L62】
- `src-tauri/src/main.rs` launching the backend sidecar via `Command::new_sidecar`. 【F:src-tauri/src/main.rs†L1-L50】
- `src-tauri/tauri.conf.json` configured for the Vite dev server, build output, and sidecar bundling. 【F:src-tauri/Cargo.toml†L1-L17】【F:src-tauri/build.rs†L1-L3】【F:src-tauri/src/main.rs†L1-L50】【F:src-tauri/src/commands.rs†L1-L164】【F:src-tauri/tauri.conf.json†L1-L43】
- Electron entrypoints (`main.js`, `preload.ts`) and dev runner (`dev-runner.js`) have been removed. 【F:package.json†L1-L41】

---

## 4. Tauri Scaffold Mapping (Concrete File Targets)

When introducing Tauri, the following project areas become the new “desktop shell” owners:

| Concern | Current Location | Tauri Location (Target) |
| --- | --- | --- |
| Shell entrypoint | Electron main process (removed) | `src-tauri/src/main.rs` |
| IPC definition | Electron preload + IPC (removed) | `src-tauri/src/commands.rs` + `#[tauri::command]` |
| Runtime config | Electron builder config (removed) | `src-tauri/tauri.conf.json` |
| Backend resource bundle | Electron extraResources (removed) | `tauri.conf.json` `bundle.resources` |

This mapping is intended to preserve existing behaviors from the legacy Electron shell while switching ownership to Tauri.

---

## 5. Proposed Migration Plan (Phased)

### Phase 0 — Alignment & Inventory

1. **Confirm native target matrix** (Windows-only vs. multi-platform). Today the repo is Windows-focused (backend exe paths and Windows bundling).
2. **Document IPC surface area** (the `window.api` methods listed below) and validate all usages in the renderer.
   - `pickFolder`, `readFile`, `writeFile`, `listJsonFiles`, `deleteFile`, `settings.read`, `settings.write`. 【F:renderer/types/global.d.ts†L3-L12】

### Phase 1 — Introduce Tauri Shell in Parallel

1. **Add Tauri scaffold** (without removing Electron yet) and point it to the existing Vite build output (`dist/index.html`).
2. **Keep existing frontend build**. Vite is already used for the renderer; Tauri can serve the same compiled assets. 【F:package.json†L18-L23】
3. **Create Tauri commands mirroring current IPC**:
   - Build a `commands.rs` layer that maps 1:1 with the Electron IPC handlers and preserves the `authorizedDirs`/`resolveSafePath` semantics (initial parity is now in place). 【F:src-tauri/src/commands.rs†L1-L164】

### Phase 2 — Replace IPC Bridge

1. **Swap `window.api` calls** to Tauri `invoke` calls in the renderer.
2. **Retain the same API contract** to keep surface-level changes minimal (same method names and return types).
3. **Move settings storage** to Tauri’s path utilities (e.g., `app_data_dir`) while preserving the `Settings/settings.json` layout for compatibility.
4. **Add a compatibility wrapper** that keeps the `window.api` shape while internally routing to Tauri `invoke` (optional but minimizes churn).
5. **Wire commands to the renderer** once Tauri is enabled so IPC parity can be validated against the existing `window.api` surface area (initial bridge implemented). 【F:renderer/core/ipc/tauriBridge.ts†L1-L62】【F:src-tauri/src/commands.rs†L1-L164】

### Phase 3 — Backend Process & Packaging

1. **Sidecar backend**: bundle the .NET backend exe using Tauri “sidecar” definitions or spawn via Rust. This replaces the Electron process spawn usage (initial sidecar spawn now in place). 【F:src-tauri/src/main.rs†L1-L50】
2. **Pass runtime port config** with environment variables or command args, preserving the current `BACKEND_PORT` default handling.
3. **Migrate packaging**:
   - Replace `electron-builder` configuration with `tauri.conf.json` bundling settings.
   - Ensure `dist-backend` artifacts are included in the Tauri bundle (similar to previous Electron extraResources). 【F:src-tauri/tauri.conf.json†L1-L43】

### Phase 4 — Decommission Electron

1. Electron dependencies (`electron`, `electron-builder`) and entrypoints (`main.js`, `preload.ts`) have been removed from the repository.
2. Electron-specific scripts and the Electron dev runner have been removed; `npm run dev` now targets Tauri. 【F:package.json†L1-L41】
3. Documentation and system diagrams have been updated to reflect the Tauri shell. 【F:docs/02_ARCHITECTURE.md†L1-L113】

---

## 6. Technical Gaps & Risks

1. **Filesystem security parity**: The legacy Electron implementation used `resolveSafePath` and an `authorizedDirs` allowlist to reduce traversal and scope access. This logic must be preserved in Rust commands to avoid regressions. 【F:src-tauri/src/commands.rs†L31-L174】
2. **Backend lifecycle**: Ensure the sidecar lifecycle hooks prevent orphaned backend processes. 【F:src-tauri/src/main.rs†L1-L72】
3. **Dev workflows**: Tauri dev mode expects the Vite server (`http://localhost:5173`); ensure workflows remain aligned.
4. **Permission model differences**: Tauri’s permissions model (allowlist + command permissions) needs to be explicitly configured to avoid widening access beyond the previous Electron constraints. 【F:src-tauri/tauri.conf.json†L1-L43】

---

## 7. Recommended Next Steps

1. **Validate file I/O commands** in Rust with the same constraints as `resolveSafePath` (ensure parity with Electron). 【F:src-tauri/src/commands.rs†L31-L174】
2. **Verify renderer bridge coverage** by testing `pickFolder`, file I/O, and settings flows under Tauri. 【F:renderer/core/ipc/tauriBridge.ts†L1-L62】
3. **Validate backend sidecar** auto-start/stop behavior with lifecycle hooks. 【F:src-tauri/src/main.rs†L1-L64】
4. **Update documentation** once the sidecar and IPC parity are verified.
5. **Add a migration test plan** focused on file I/O, settings persistence, and backend startup so parity is validated in the same areas now owned by Tauri. 【F:src-tauri/src/commands.rs†L31-L174】【F:src-tauri/src/main.rs†L1-L72】

---

## 8. Migration Checklist (1:1 Surface Area)

- [ ] Window setup and dev/prod URL switching.
- [ ] IPC surface parity for `window.api` functions. 【F:renderer/core/ipc/tauriBridge.ts†L1-L62】
- [ ] Backend process spawn and environment parity. 【F:src-tauri/src/main.rs†L1-L72】
- [ ] File system authorization logic ported. 【F:src-tauri/src/commands.rs†L31-L174】
- [ ] Packaging with backend resources. 【F:src-tauri/tauri.conf.json†L1-L43】
- [ ] Permissions model mirrors legacy allowlist behavior. 【F:src-tauri/tauri.conf.json†L1-L43】

---

## Appendix — Electron-specific Files Retired

- `main.js` (Electron main process)
- `preload.ts` / `preload.js` (IPC bridge)
- Electron dependencies and scripts in `package.json`

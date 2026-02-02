# 01_SYSTEM_OVERVIEW

**Code Snapshot**: 2026-02-02

---

## 1. Purpose (Verbatim from README)

> "Manual testing of ARAS PLM configurations is tedious, repetitive, and prone to human error. **ARASTester** changes the game."
>
> "Designed specifically for **ARAS PLM Testers** and **Configuration Developers**, this tool empowers you to build, organize, and execute complex test scenarios without writing a single line of code."

**Source**: [README.md](../README.md)

---

## 2. Purpose (from `package.json`)

> "This is a application for automatic testing of ARAS"

**Source**: [package.json](../package.json)

---

## 3. Key Features (Verbatim from README)

| Feature                   | Description                                   |
| ------------------------- | --------------------------------------------- |
| Visual Test Builder       | Drag-and-drop interface for test plans        |
| Native ARAS Operations    | Workflow, File Vault, and Lifecycle tracking  |
| Hierarchical Organization | Nested test tree structure                    |
| Advanced Assertions       | Verification of properties, counts, and locks |
| Privacy First             | Local JSON file storage, no cloud             |

---

## 4. Target Users (Verbatim from README)

- **QA Teams**: Reduce regression testing time from days to minutes.
- **Developers**: Verify configuration changes instantly.

**Source**: [README.md](../README.md)

---

## 5. Application Metadata (from `package.json`)

| Field    | Value                                   |
| -------- | --------------------------------------- |
| Name     | arastester                              |
| Version  | 1.0.0                                   |
| Author   | Gopale Ashwin                           |
| License  | ISC                                     |
| Platform | win-x64 (from csproj RuntimeIdentifier) |

**Source**: [package.json](../package.json)

---

## 6. Technology Stack Claims in README

| Category         | Technologies Listed                | Verified                            |
| ---------------- | ---------------------------------- | ----------------------------------- |
| Frontend         | React 19, Vite, Tailwind, Radix UI | ✅ Present in FACT_DEPENDENCIES.md  |
| Backend          | ASP.NET Core (.NET 8), Aras.IOM    | ✅ Verified in FACT_DEPENDENCIES.md |
| State Management | Zustand, Immer, Local JSON Storage | ✅ Verified in package.json         |

---

## 7. System Invariants (Maintainer Contract)

These invariants are **architectural guarantees**. If code behavior deviates from these without a documentation update, it is a regression.

1.  **Backend Authoritative Truth**: The ASP.NET Core backend is the **sole source of truth** for active IOM connections. Use `GET /api/aras/sessions` to retrieve the current state.
2.  **Frontend Sync Requirement**: The Frontend maintains a _cached_ representation of session state. It **MUST** strictly re-sync (via `fetchSessions`) after any mutation (Connect/Disconnect). Optimistic UI updates for connection state are **forbidden**.
3.  **Process-Scoped Scope**: Sessions are **Process-Scoped Singletons**. They are shared by all clients/windows connected to the same backend process. There is no user-level isolation within the single-tenant desktop app.
4.  **Profile Override Precedence**: A Test Step with a defined `sessionProfileId` **MUST** attempt to connect that specific session if it is not currently active, overriding any global session selection.

---

## 8. Session & State Model

This section defines the lifecycle of an ARAS Connection.

### 8.1 State Machine

| State                | Description                                                                                   | Allowed Transitions                                             |
| -------------------- | --------------------------------------------------------------------------------------------- | --------------------------------------------------------------- |
| **Offline**          | No active IOM connection for a given session name.                                            | `Connecting` (via User/Test Action)                             |
| **Connecting**       | Handshake with ARAS Server in progress.                                                       | `Connected` (Success), `FailedConnecting` (Error)               |
| **Connected**        | Valid IOM `HttpServerConnection` exists in memory.                                            | `Disconnecting` (User Action), `Offline` (Timeout/Server Reset) |
| **Disconnecting**    | Teardown in progress (Async).                                                                 | `Offline` (Success), `FailedDisconnect` (Error)                 |
| **FailedConnecting** | Last attempt failed. Effectively `Offline` but may show error UI.                             | `Connecting` (Retry)                                            |
| **FailedDisconnect** | Teardown failed (e.g., API timeout). State is indeterminate (assume `Connected` or `Zombie`). | `Disconnecting` (Retry)                                         |

### 8.2 Failure & Recovery

- **No Auto-Retry**: The system does **NOT** automatically retry failed connections. This is a design choice to prevent account lockouts.
- **Graceful Degradation**: If `disconnect` fails (e.g., server unreachable), the backend should force-clear the local reference to prevent "stuck" sessions.

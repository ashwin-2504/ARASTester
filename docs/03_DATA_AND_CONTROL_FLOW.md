# 03_DATA_AND_CONTROL_FLOW

> ⚠ HUMAN REVIEW REQUIRED
>
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-28
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Observable Call Chains

### 1.1 ARAS Item Query Flow

```
User Action (UI)
    │
    ▼
HTTP POST /api/aras/query (body: QueryRequest)
    │
    ▼
ItemController.Query() [Line 18-19]
    │ calls: _itemService.QueryItems(request)
    ▼
ItemAppService.QueryItems()
    │ calls: _gateway.QueryItems(request)
    ▼
ArasGateway.QueryItems() [Lines 44-70]
    │ calls: _sessionManager.Execute(callback)
    │     ├── resolves: ISessionContext.SessionId
    │     └── retrieves: IOM.Innovator object
    │
    ▼
ARAS IOM SDK → Innovator Server
    │
    ▼
ItemResponse { Success, Message, Data, ItemCount }
```

**Source**: FACT_PUBLIC_INTERFACES.md, ArasGateway.cs Lines 44-70

### 1.2 ARAS Connection Flow

```
User Action (Connect Button)
    │
    ▼
HTTP POST /api/aras/connect (body: ConnectionRequest)
    │
    ▼
ConnectionController.Connect() [Lines 18-23]
    │ calls: _connectionService.Connect(request)
    ▼
ConnectionAppService.Connect()
    │ calls: _sessionManager.Connect(request)
    ▼
ArasSessionManager (Infrastructure)
    │ calls: IomFactory.CreateHttpServerConnection()
    │ calls: connection.Login()
    ▼
ConnectionResponse { Success, Message, ServerInfo }
```

**Source**: FACT_PUBLIC_INTERFACES.md, ConnectionController.cs Lines 18-23

### 1.3 Electron IPC Flow

```
Renderer Process (React)
    │ invokes: window.api.readFile(baseDir, relativePath)
    ▼
    preload.js (contextBridge.exposeInMainWorld)
    │ calls: ipcRenderer.invoke("fs:readFile", baseDir, relativePath)
    ▼
main.js (ipcMain.handle)
    │ handler: "fs:readFile"
    │ calls: resolveSafePath(baseDir, relativePath)
    │     ├── validates: baseDir in Set[authorizedDirs]
    │     ├── resolves: canonicalBase = realpathSync(baseDir)
    │     ├── normalizes: relativePath matches [..] or isAbsolute
    │     └── confirms: canonicalTarget.startsWith(canonicalBase)
    │ calls: fs.promises.readFile(safePath, "utf-8")
    ▼
File System
    │
    ▼
Returns: file content string
```

**Source**: main.js

---

## 2. Traceable Flows (Confirmed End-to-End)

| Flow       | Start                            | End       | Status       |
| ---------- | -------------------------------- | --------- | ------------ |
| Item CRUD  | UI → API → Gateway → ARAS        | Confirmed | ✅ Traceable |
| Connection | UI → API → SessionManager → ARAS | Confirmed | ✅ Traceable |
| File I/O   | Renderer → IPC → Main → FS       | Confirmed | ✅ Traceable |

---

## 3. Flows Not Traceable from Code

| Flow                         | Reason                                              |
| ---------------------------- | --------------------------------------------------- |
| Frontend Component Lifecycle | Requires runtime analysis, not statically traceable |
| Action Execution Order       | Determined by user-created test plan JSON, not code |

> End-to-end data flow for user-defined test execution is not fully traceable from code alone.

# 05_BACKEND

**Code Snapshot**: 2026-02-02

---

## 1. Technology Stack (from FACT_DEPENDENCIES.md)

| Package                                               | Version               | Project                     |
| ----------------------------------------------------- | --------------------- | --------------------------- |
| .NET SDK                                              | Microsoft.NET.Sdk.Web | ArasBackend.csproj          |
| Target Framework                                      | net8.0                | All projects                |
| Aras.IOM                                              | 15.0.1                | ArasBackend, Infrastructure |
| Swashbuckle.AspNetCore                                | 6.4.0                 | ArasBackend                 |
| Microsoft.Extensions.DependencyInjection.Abstractions | 10.0.2                | Application, Infrastructure |
| Microsoft.AspNetCore.Http.Abstractions                | 2.2.0                 | ArasBackend (Web host)      |

---

## 2. Folder and Namespace Groupings

**No architectural meaning is assigned** to folder names. This is simply the observed structure.

| Folder                                      | Namespace                           |
| ------------------------------------------- | ----------------------------------- |
| backend/ArasBackend/Controllers             | ArasBackend.Controllers             |
| backend/ArasBackend/Services                | ArasBackend.Services (Web Specific) |
| backend/ArasBackend/Middleware              | ArasBackend.Middleware              |
| backend/ArasBackend.Core/Models             | ArasBackend.Core.Models             |
| backend/ArasBackend.Core/Interfaces         | ArasBackend.Core.Interfaces         |
| backend/ArasBackend.Core/Exceptions         | ArasBackend.Core.Exceptions         |
| backend/ArasBackend.Application/Services    | ArasBackend.Application.Services    |
| backend/ArasBackend.Application/Interfaces  | ArasBackend.Application.Interfaces  |
| backend/ArasBackend.Infrastructure/Gateways | ArasBackend.Infrastructure.Gateways |
| backend/ArasBackend.Infrastructure/Services | ArasBackend.Infrastructure.Services |

---

## 3. Controllers (from FACT_PUBLIC_INTERFACES.md)

### ConnectionController

**File**: `backend/ArasBackend/Controllers/ConnectionController.cs`
**Base Route**: `/api/aras`

| Method         | HTTP | Route              |
| -------------- | ---- | ------------------ |
| Connect        | POST | /connect           |
| Disconnect     | POST | /disconnect        |
| GetAllSessions | GET  | /sessions          |
| GetStatus      | GET  | /connection-status |
| Validate       | GET  | /validate          |

### ItemController

**File**: `backend/ArasBackend/Controllers/ItemController.cs`
**Base Route**: `/api/aras`

| Category             | Methods                                                                                                                       |
| -------------------- | ----------------------------------------------------------------------------------------------------------------------------- |
| **CRUD**             | Query, GetById, GetByKeyedName, Create, Update, Delete, Purge                                                                 |
| **Locking**          | Lock, Unlock, CheckLock                                                                                                       |
| **Lifecycle**        | Promote, GetState                                                                                                             |
| **Relationships**    | AddRelationship, GetRelationships, DeleteRelationship                                                                         |
| **AML/SQL/Method**   | ApplyAml, ApplySql, ApplyMethod                                                                                               |
| **Assertions**       | AssertExists, AssertNotExists, AssertProperty, AssertState, AssertPropertyContains, AssertCount, AssertLocked, AssertUnlocked |
| **Workflow & Files** | StartWorkflow, GetAssignedActivities, CompleteActivity, UploadFile, DownloadFile, VerifyFileExists                            |
| **Utility**          | GenerateId, GetNextSequence, Wait, SetVariable, LogMessage                                                                    |

---

## 4. ArasGateway Methods (from FACT_PUBLIC_INTERFACES.md)

**File**: `backend/ArasBackend.Infrastructure/Gateways/ArasGateway.cs`
**Implements**: `IArasGateway`

Detailed IOM mappings are documented in the code. The gateway acts as a host-agnostic wrapper around the ARAS IOM SDK, executing all operations through the `ArasSessionManager`.

---

## 5. Domain Models (from FACT_DOMAIN_TERMS.md)

All models are defined in `backend/ArasBackend.Core/Models/ArasModels.cs` (Request/Response contracts).

---

## 6. IOM SDK Alignment

### 6.1 Connection Pattern (Verified)

Per SDK Section 1.2, the correct connection pattern is:

```csharp
var conn = IomFactory.CreateHttpServerConnection(url, db, user, pass);
var loginResult = conn.Login();
if (loginResult.isError()) throw new Exception(loginResult.getErrorString());
var innovator = loginResult.getInnovator();
```

**ARASTester Implementation**: ✅ `ArasSessionManager` follows this pattern.

### 6.2 Best Practices Applied (from SDK Section 4)

| Best Practice                        | SDK Section | ARASTester Implementation                       |
| ------------------------------------ | ----------- | ----------------------------------------------- |
| Use `select` attribute to limit data | 4.1         | ✅ QueryItems, GetItemById, CheckLockStatus     |
| Use pagination for large queries     | 4.2         | ✅ QueryRequest has Page/PageSize               |
| Check for errors after apply()       | 5.4         | ✅ All gateway methods check `result.isError()` |

### 6.3 Implementation Status (✅ Finalized)

| Category                    | Implemented | Status             |
| --------------------------- | ----------- | ------------------ |
| Connection & Authentication | 5/5         | ✅ 100% Core       |
| Item CRUD                   | 7/7         | ✅ 100% Core       |
| Lock Operations             | 3/3         | ✅ 100% Core       |
| Lifecycle Operations        | 2/2         | ✅ 100% Core       |
| Relationship Operations     | 3/3         | ✅ 100% Core       |
| Workflow Operations         | 3/3         | ✅ 100% Advanced   |
| AML & SQL Execution         | 3/3         | ✅ 100% Core       |
| Assertions                  | 8/8         | ✅ 100% Quality    |
| File Vault Operations       | 3/3         | ✅ 100% Advanced   |
| Utility Actions             | 5/5         | ✅ 100% Automation |

**Total**: 42/42 actions implemented.

---

## 7. Backend Contracts

### 7.1 Session Identity & Concurrency

- **Scope**: Sessions are **Process-Scoped Singletons**. A single backend process manages a pool of sessions.
- **Identity**: `sessionName` is the **Unique Identifier** for a connection.
- **Multi-Tenancy**: The backend supports multiple concurrent connections to different ARAS instances or databases within the same process.

### 7.2 Failure Modes

| Operation          | Scenario              | Contract Behavior                                                      |
| ------------------ | --------------------- | ---------------------------------------------------------------------- |
| `POST /connect`    | ARAS Unreachable      | Throws `ArasInfrastructureException` → Returns **502 Bad Gateway**.    |
| `POST /connect`    | Bad Credentials       | Throws `ArasAuthException` → Returns **401 Unauthorized**.             |
| `POST /disconnect` | Invalid `sessionName` | **Idempotent Success**. Returns Success even if session did not exist. |
| `ANY`              | Item Not Found        | Throws `ArasNotFoundException` → Returns **404 Not Found**.            |

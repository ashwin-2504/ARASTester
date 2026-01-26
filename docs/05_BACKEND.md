# 05_BACKEND

> ⚠ HUMAN REVIEW REQUIRED
>
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-20
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Technology Stack (from FACT_DEPENDENCIES.md)

| Package                                               | Version               | Project                     |
| ----------------------------------------------------- | --------------------- | --------------------------- |
| .NET SDK                                              | Microsoft.NET.Sdk.Web | ArasBackend.csproj          |
| Target Framework                                      | net8.0                | All projects                |
| Aras.IOM                                              | 15.0.1                | ArasBackend, Infrastructure |
| Swashbuckle.AspNetCore                                | 6.4.0                 | ArasBackend                 |
| Microsoft.Extensions.DependencyInjection.Abstractions | 10.0.2                | Application, Infrastructure |

---

## 2. Folder and Namespace Groupings

**No architectural meaning is assigned** to folder names. This is simply the observed structure.

| Folder                                      | Namespace                           |
| ------------------------------------------- | ----------------------------------- |
| backend/ArasBackend/Controllers             | ArasBackend.Controllers             |
| backend/ArasBackend/Middleware              | ArasBackend.Middleware              |
| backend/ArasBackend.Core/Models             | ArasBackend.Core.Models             |
| backend/ArasBackend.Core/Interfaces         | ArasBackend.Core.Interfaces         |
| backend/ArasBackend.Core/Exceptions         | ArasBackend.Core.Exceptions         |
| backend/ArasBackend.Application/Services    | ArasBackend.Application.Services    |
| backend/ArasBackend.Infrastructure/Gateways | ArasBackend.Infrastructure.Gateways |
| backend/ArasBackend.Infrastructure/Services | ArasBackend.Infrastructure.Services |

---

## 3. Controllers (from FACT_PUBLIC_INTERFACES.md)

### ConnectionController

**File**: `backend/ArasBackend/Controllers/ConnectionController.cs`
**Base Route**: `/api/aras`

| Method     | HTTP | Route              | Lines |
| ---------- | ---- | ------------------ | ----- |
| Connect    | POST | /connect           | 18-23 |
| Disconnect | POST | /disconnect        | 25-30 |
| GetStatus  | GET  | /connection-status | 32-37 |
| Validate   | GET  | /validate          | 39-44 |

### ItemController

**File**: `backend/ArasBackend/Controllers/ItemController.cs`
**Base Route**: `/api/aras`

| Method             | HTTP | Route                | Request Type              | Lines |
| ------------------ | ---- | -------------------- | ------------------------- | ----- |
| Query              | POST | /query               | QueryRequest              | 18-19 |
| GetById            | POST | /get-by-id           | GetByIdRequest            | 21-22 |
| GetByKeyedName     | POST | /get-by-keyed-name   | GetByKeyedNameRequest     | 24-25 |
| Create             | POST | /create              | CreateItemRequest         | 27-28 |
| Update             | POST | /update              | UpdateItemRequest         | 30-31 |
| Delete             | POST | /delete              | DeleteItemRequest         | 33-34 |
| Purge              | POST | /purge               | DeleteItemRequest         | 36-37 |
| Lock               | POST | /lock                | LockRequest               | 39-40 |
| Unlock             | POST | /unlock              | LockRequest               | 42-43 |
| CheckLock          | POST | /check-lock          | LockRequest               | 45-46 |
| Promote            | POST | /promote             | PromoteRequest            | 48-49 |
| GetState           | POST | /get-state           | GetByIdRequest            | 51-52 |
| AddRelationship    | POST | /add-relationship    | AddRelationshipRequest    | 54-55 |
| GetRelationships   | POST | /get-relationships   | GetRelationshipsRequest   | 57-58 |
| DeleteRelationship | POST | /delete-relationship | DeleteRelationshipRequest | 60-61 |
| ApplyAml           | POST | /apply-aml           | ApplyAmlRequest           | 63-64 |
| ApplySql           | POST | /apply-sql           | ApplySqlRequest           | 66-67 |
| ApplyMethod        | POST | /apply-method        | ApplyMethodRequest        | 69-70 |
| AssertExists       | POST | /assert-exists       | AssertExistsRequest       | 73-74 |
| AssertNotExists    | POST | /assert-not-exists   | AssertExistsRequest       | 76-77 |
| AssertProperty     | POST | /assert-property     | AssertPropertyRequest     | 79-80 |
| AssertState        | POST | /assert-state        | AssertStateRequest        | 82-83 |

---

## 4. ArasGateway Methods (from FACT_PUBLIC_INTERFACES.md)

**File**: `backend/ArasBackend.Infrastructure/Gateways/ArasGateway.cs`
**Implements**: `IArasGateway`

| Method              | ARAS IOM Operation                                            | Lines   |
| ------------------- | ------------------------------------------------------------- | ------- |
| QueryItems          | newItem(type, "get") → apply()                                | 44-70   |
| GetItemById         | newItem(type, "get") → setID() → apply()                      | 72-84   |
| GetItemByKeyedName  | getItemByKeyedName()                                          | 86-89   |
| CreateItem          | newItem(type, "add") → setProperty() → apply()                | 91-100  |
| UpdateItem          | newItem(type, "edit") → setID() → setProperty() → apply()     | 102-112 |
| DeleteItem          | newItem(type, "delete") → setID() → apply()                   | 114-122 |
| PurgeItem           | newItem(type, "purge") → setID() → apply()                    | 124-132 |
| LockItem            | newItem(type, "lock") → setID() → apply()                     | 134-142 |
| UnlockItem          | newItem(type, "unlock") → setID() → apply()                   | 144-152 |
| CheckLockStatus     | newItem(type, "get") → setAttribute("select", "locked_by_id") | 154-175 |
| AddRelationship     | newItem(relType, "add") → setProperty(source_id, related_id)  | 177-192 |
| GetRelationships    | newItem(relType, "get") → setProperty("source_id")            | 194-205 |
| DeleteRelationship  | newItem(relType, "delete") → setID()                          | 207-215 |
| PromoteItem         | newItem(type, "promoteItem") → setProperty("state")           | 217-228 |
| GetCurrentState     | newItem(type, "get") → setAttribute("select", "state")        | 230-251 |
| ApplyAML            | applyAML(aml)                                                 | 253-261 |
| ApplySQL            | applySQL(sql)                                                 | 263-266 |
| ApplyMethod         | applyMethod(name, body)                                       | 268-271 |
| AssertItemExists    | newItem(type, "get") → apply() → check count > 0              | 273-291 |
| AssertItemNotExists | newItem(type, "get") → apply() → check count == 0             | 293-311 |
| AssertPropertyValue | getItemById() → getProperty() == expected                     | 313-329 |
| AssertState         | getItemById() → getProperty("state") == expected              | 331-347 |

---

## 5. Domain Models (from FACT_DOMAIN_TERMS.md)

All models are defined in `backend/ArasBackend.Core/Models/ArasModels.cs`:

| Model                    | Purpose                       | Line Range |
| ------------------------ | ----------------------------- | ---------- |
| ServerInfo               | ARAS connection metadata      | 5-11       |
| ConnectionRequest        | Login credentials             | 13-19      |
| ConnectionResponse       | Login result                  | 21-26      |
| ConnectionStatusResponse | Connection state              | 28-33      |
| QueryRequest             | Item query parameters         | 35-42      |
| GetByIdRequest           | Single item lookup            | 44-49      |
| ItemResponse             | Generic item operation result | 150-156    |
| AssertionResponse        | Test assertion result         | 158-165    |

_(Full list in FACT_DOMAIN_TERMS.md)_

---

## 6. IOM SDK Alignment

### 6.1 Connection Pattern (Verified)

Per SDK Section 1.2, the correct connection pattern is:

```csharp
var conn = IomFactory.CreateHttpServerConnection(url, db, user, pass);
var loginResult = conn.Login();
if (loginResult.isError()) throw new Exception(loginResult.getErrorString());
var innovator = IomFactory.CreateInnovator(conn);
```

**ARASTester Implementation**: ✅ `ArasSessionManager` follows this pattern.

### 6.2 Best Practices Applied (from SDK Section 4)

| Best Practice                        | SDK Section | ARASTester Implementation                       |
| ------------------------------------ | ----------- | ----------------------------------------------- |
| Use `select` attribute to limit data | 4.1         | ✅ QueryItems, GetItemById, CheckLockStatus     |
| Use pagination for large queries     | 4.2         | ✅ QueryRequest has Page/PageSize               |
| Check for errors after apply()       | 5.4         | ✅ All gateway methods check `result.isError()` |

### 6.3 Implementation Status

| Category                    | Implemented | Pending |
| --------------------------- | ----------- | ------- |
| Connection & Authentication | 3/3 ✅      | 0       |
| Item CRUD                   | 7/7 ✅      | 0       |
| Lock Operations             | 3/3 ✅      | 0       |
| Lifecycle Operations        | 2/2 ✅      | 0       |
| Relationship Operations     | 3/3 ✅      | 0       |
| Workflow Operations         | 0/3         | 3 ⬜    |
| AML & SQL Execution         | 3/3 ✅      | 0       |
| Assertions                  | 4/8 ✅      | 4 ⬜    |
| File Vault Operations       | 0/3         | 3 ⬜    |
| Utility Actions             | 0/5         | 5 ⬜    |

**Total**: 25 implemented, 15 pending

---

## 7. Backend Contracts

### 7.1 Session Identity & Concurrency

- **Scope**: Sessions are **Process-Scoped Singletons**. A single backend process manages a pool of sessions shared by all connected clients. There is NO per-user isolation in the current single-tenant architecture.
- **Identity**: `sessionName` is the **Unique Identifier** (Key) for a connection within the process.
  - _Constraint_: Two sessions cannot share the same `sessionName`. Attempting to connect with an existing name (if allowed) overrides the previous connection.
- **Concurrency**:
  - Multiple active sessions are supported concurrently.
  - **Limit**: Unbounded (technically limited by server memory/resources).
  - **Isolation**: Sessions are isolated by their `sessionName` key. One test execution using "Session A" does not affect state in "Session B".

### 7.2 Failure Modes

| Operation          | Scenario              | Contract Behavior                                                                |
| ------------------ | --------------------- | -------------------------------------------------------------------------------- |
| `POST /connect`    | ARAS Unreachable      | Returns `Success: false` with specific error message. **No session is created**. |
| `POST /connect`    | Bad Credentials       | Returns `Success: false`. **No session is created**.                             |
| `POST /disconnect` | Invalid `sessionName` | **Idempotent Success**. Returns `Success: true` even if session did not exist.   |
| `POST /disconnect` | API Failure (500)     | Local session reference is forcibly cleared to prevent "zombie" states.          |

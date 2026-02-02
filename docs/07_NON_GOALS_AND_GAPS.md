# 07_NON_GOALS_AND_GAPS

**Code Snapshot**: 2026-02-02

---

## 1. Features Implemented

### Workflow Operations (✅ Implemented)

| Action                | IOM Method                          | Status         |
| --------------------- | ----------------------------------- | -------------- |
| StartWorkflow         | `item.apply("startWorkflow")`       | ✅ Implemented |
| GetAssignedActivities | `innovator.getAssignedActivities()` | ✅ Implemented |
| CompleteActivity      | Activity item → `EvaluateActivity`  | ✅ Implemented |

### File Vault Operations (✅ Implemented)

| Action           | IOM Method                         | Status         |
| ---------------- | ---------------------------------- | -------------- |
| UploadFile       | `item.setFileProperty(prop, path)` | ✅ Implemented |
| DownloadFile     | `fileItem.checkout(dir)`           | ✅ Implemented |
| VerifyFileExists | Check if property is set           | ✅ Implemented |

### Additional Assertions (✅ Implemented)

| Action                 | Pass Condition               | Status         |
| ---------------------- | ---------------------------- | -------------- |
| AssertPropertyContains | `getProperty().Contains()`   | ✅ Implemented |
| AssertCount            | `getItemCount() == Expected` | ✅ Implemented |
| AssertLocked           | `locked_by_id != null`       | ✅ Implemented |
| AssertUnlocked         | `locked_by_id == null`       | ✅ Implemented |

### Utility Actions (✅ Implemented)

| Action          | IOM Method                        | Status         |
| --------------- | --------------------------------- | -------------- |
| GenerateID      | `innovator.getNewID()`            | ✅ Implemented |
| GetNextSequence | `innovator.getNextSequence(name)` | ✅ Implemented |
| Wait            | `Task.Delay()`                    | ✅ Implemented |
| SetVariable     | Session Store                     | ✅ Implemented |
| LogMessage      | Session Logging                   | ✅ Implemented |

---

## 2. Known Documentation Gaps

| Gap                                            | Status                                                 |
| ---------------------------------------------- | ------------------------------------------------------ |
| ~~Store implementation details~~               | ✅ Documented in 04_FRONTEND.md                        |
| ~~ExceptionHandlingMiddleware implementation~~ | ✅ Documented in 06_SECURITY_AND_FAILURES.md           |
| ~~Action execution flow~~                      | ✅ Documented in 04_FRONTEND.md (ActionExecutor)       |
| Frontend component logic                       | ⬜ Individual .jsx files not extracted                 |
| Test coverage                                  | ⬜ ArasBackend.Tests project exists but not documented |

---

## 3. Discrepancies Found

| Item                  | Discrepancy                                                                                                                                                          |
| --------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **StartWorkflow Map** | Frontend `ActionSchema` marks `workflowMap` as **required**, but `ArasGateway.cs` currently returns an error if a map is provided (only default workflow supported). |
| **Wait/Log/Variable** | Backend provides endpoints for these utility actions, but `ActionExecutor.ts` implements them **client-side** by default for responsiveness.                         |

---

## 4. Open Questions - Answered

### Q1: Authentication Strategy

**Question**: Is ARAS session-cookie based auth sufficient for production?

**Answer** (from `ConnectionController.cs`):

- **Current Implementation**: Cookie-based session (`ARAS_SESSION_ID`) set in the presentation layer.
- **Cookie Settings** (Lines 26-31):
  - `HttpOnly = true` ✅ (XSS protection)
  - `Secure = false` ⚠ (allows HTTP, intended for localhost)
  - `SameSite = Lax` ✅ (CSRF protection)
- **Recommendation**: For production, set `Secure = true` and ensure HTTPS.

---

### Q2: Workflow Endpoints

**Question**: Are StartWorkflow, GetAssignedActivities, CompleteActivity planned or deprecated?

**Answer**:

- **Status**: ✅ Implemented in `ArasGateway.cs`.
- **Note**: Currently supports default workflow for an item; explicit map selection is pending full implementation. (Ref: `action-schemas.json` Lines 562-631)

---

### Q3: File Vault

**Question**: Is file upload/download functionality planned?

**Answer**:

- **Status**: ✅ Implemented in `ArasGateway.cs`.
- **Note**: Uses `setFileProperty` for upload and `checkout` for download. (Schema exists in `action-schemas.json`)

---

### Q4: Production CORS

**Question**: What origins should be allowed in production?

**Answer** (from `Program.cs` Lines 14-15):

```csharp
policy.WithOrigins("http://localhost:3000", "http://localhost:5173")
      .SetIsOriginAllowed(origin => new Uri(origin).Host == "localhost")
```

- **Current**: Only localhost allowed
- **Production Recommendation**:
  - Remove localhost-only restriction
  - Add production domain(s) explicitly
  - Consider environment-based configuration

---

### Q5: Error Exposure

**Question**: Should ARAS error strings be sanitized before returning to frontend?

**Answer** (from `ArasGateway.cs` and `ArasSessionManager.cs`):

```csharp
Message = result.getErrorString()  // ArasGateway
throw new ArasAuthException(loginResult.getErrorString());  // SessionManager
```

- **Current**: Raw ARAS error strings are returned
- **Risk**: May expose internal system details
- **Recommendation**: Sanitization is planned once a robust error mapping system is implemented.

---

## 5. Explicit Non-Goals (Not in Scope)

Based on codebase analysis, the following are NOT implemented:

- User management / multi-tenancy
- Test result persistence (database)
- CI/CD integration
- Remote test execution
- API authentication (JWT, OAuth)
- Role-based access control

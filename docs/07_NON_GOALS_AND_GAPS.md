# 07_NON_GOALS_AND_GAPS

> ⚠ HUMAN REVIEW REQUIRED
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-20
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Features Referenced but Not Implemented

### Workflow Operations (⬜ Pending)
| Action | IOM Method | Status |
|--------|------------|--------|
| StartWorkflow | `item.apply("startWorkflow")` | ⬜ Pending |
| GetAssignedActivities | `innovator.getAssignedActivities()` | ⬜ Pending |
| CompleteActivity | Activity item → `apply("closeActivity")` | ⬜ Pending |

### File Vault Operations (⬜ Pending)
| Action | IOM Method | Status |
|--------|------------|--------|
| UploadFile | `item.setFileProperty(prop, path)` | ⬜ Pending |
| DownloadFile | `item.fetchFileProperty(prop, path)` | ⬜ Pending |
| VerifyFileExists | Check `File` relationship | ⬜ Pending |

### Additional Assertions (⬜ Pending)
| Action | Pass Condition | Status |
|--------|----------------|--------|
| AssertPropertyContains | `getProperty().Contains()` | ⬜ Pending |
| AssertCount | `getItemCount() == Expected` | ⬜ Pending |
| AssertLocked | `locked_by_id != null` | ⬜ Pending |
| AssertUnlocked | `locked_by_id == null` | ⬜ Pending |

### Utility Actions (⬜ Pending)
| Action | IOM Method | Status |
|--------|------------|--------|
| GenerateID | `innovator.getNewID()` | ⬜ Pending |
| GetNextSequence | `innovator.getNextSequence(name)` | ⬜ Pending |
| Wait | `Task.Delay()` | ⬜ Pending |
| SetVariable | Internal storage | ⬜ Pending |
| LogMessage | Internal logging | ⬜ Pending |

---

## 2. Known Documentation Gaps

| Gap | Status |
|-----|--------|
| ~~Store implementation details~~ | ✅ Documented in 04_FRONTEND.md |
| ~~ExceptionHandlingMiddleware implementation~~ | ✅ Documented in 06_SECURITY_AND_FAILURES.md |
| ~~Action execution flow~~ | ✅ Documented in 04_FRONTEND.md (ActionExecutor) |
| Frontend component logic | ⬜ Individual .jsx files not extracted |
| Test coverage | ⬜ ArasBackend.Tests project exists but not documented |

---

## 3. Discrepancies Found

| Item | Discrepancy |
|------|-------------|
| Frontend Schema vs Backend | Some schema actions (File Vault, Workflow) have no backend endpoints |

---

## 4. Open Questions - Answered

### Q1: Authentication Strategy
**Question**: Is ARAS session-cookie based auth sufficient for production?

**Answer** (from `ArasSessionManager.cs`):
- **Current Implementation**: Cookie-based session (`ARAS_SESSION_ID`) stored via `IConnectionStore`
- **Cookie Settings** (Lines 28-33):
  - `HttpOnly = true` ✅ (XSS protection)
  - `Secure = false` ⚠ (allows HTTP, intended for localhost)
  - `SameSite = Lax` ✅ (CSRF protection)
- **Recommendation**: For production, set `Secure = true` and ensure HTTPS.

---

### Q2: Workflow Endpoints
**Question**: Are StartWorkflow, GetAssignedActivities, CompleteActivity planned or deprecated?

**Answer**:
- **Status**: ⬜ Pending (Phase 3: Advanced - "Nice to Have")
- **Priority**: Lower priority per implementation roadmap
- **Schema Exists**: Yes, defined in `action-schemas.json` (Lines 562-631)
- **Backend**: No endpoints implemented yet

---

### Q3: File Vault
**Question**: Is file upload/download functionality planned?

**Answer**:
- **Status**: ⬜ Pending (Phase 3: Advanced)
- **IOM Methods Available**: `item.setFileProperty()`, `item.fetchFileProperty()`
- **Schema Exists**: Yes, category "file" in `action-schemas.json`
- **Backend**: No endpoints implemented yet

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

**Answer** (from `ArasGateway.cs` Line 26 and `ArasSessionManager.cs` Line 86):
```csharp
Message = result.getErrorString()  // ArasGateway
throw new ArasAuthException(loginResult.getErrorString());  // SessionManager
```
- **Current**: Raw ARAS error strings are returned
- **Risk**: May expose internal system details
- **Recommendation**:
  - Log full errors server-side
  - Return sanitized messages to frontend (e.g., "Operation failed")
  - Consider error codes for debugging

---

## 5. Explicit Non-Goals (Not in Scope)

Based on codebase analysis, the following are NOT implemented:

- User management / multi-tenancy
- Test result persistence (database)
- CI/CD integration
- Remote test execution
- API authentication (JWT, OAuth)
- Role-based access control

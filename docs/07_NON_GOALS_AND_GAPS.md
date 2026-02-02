# 07_NON_GOALS_AND_GAPS

> ⚠ HUMAN REVIEW REQUIRED
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-02-28

---

## 1. Features Referenced but Not Implemented

*(None identified in current snapshot. Previous gaps in Workflow and File Operations have been implemented in the backend controllers.)*

---

## 2. Known Documentation Gaps

| Gap | Status |
|-----|--------|
| Frontend component logic | ⬜ Individual .jsx files not extracted |
| Test coverage | ⬜ ArasBackend.Tests project exists but not documented |

---

## 3. Discrepancies Found

| Item | Discrepancy |
|------|-------------|
| (None) | Previous discrepancies regarding backend stack and missing endpoints have been resolved. |

---

## 4. Open Questions - Answered

### Q1: Authentication Strategy
**Question**: Is ARAS session-cookie based auth sufficient for production?
**Answer**: Yes, for current scope. `ArasSessionManager` uses `ARAS_SESSION_ID` with `HttpOnly` and `SameSite=Lax`. Production should force `Secure=true`.

### Q2: Production CORS
**Question**: What origins should be allowed in production?
**Answer**: Currently hardcoded to localhost. Production requires specific domain configuration.

### Q3: Error Exposure
**Question**: Should ARAS error strings be sanitized?
**Answer**: Currently raw error strings are passed to frontend.

---

## 5. Explicit Non-Goals (Not in Scope)

Based on codebase analysis, the following are NOT implemented:

- User management / multi-tenancy
- Test result persistence (database)
- CI/CD integration
- Remote test execution
- API authentication (JWT, OAuth)
- Role-based access control

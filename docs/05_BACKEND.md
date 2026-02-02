# 05_BACKEND

> ⚠ HUMAN REVIEW REQUIRED
>
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-02-28

---

## 1. Technology Stack

- **Framework**: ASP.NET Core (.NET 8.0)
- **SDK**: Aras.IOM 15.0.1
- **API**: Controllers with Swagger

---

## 2. Controllers (Verified)

### ConnectionController
- Connect, Disconnect, DisconnectSession
- GetAllSessions, GetStatus, Validate

### ItemController
- **CRUD**: Query, GetById, GetByKeyedName, Create, Update, Delete, Purge
- **Locking**: Lock, Unlock, CheckLock, AssertLocked, AssertUnlocked
- **Lifecycle**: Promote, GetState, AssertState
- **Relationships**: Add, Get, Delete
- **Execution**: ApplyAml, ApplySql, ApplyMethod
- **Workflow**: StartWorkflow, GetAssignedActivities, CompleteActivity
- **Files**: UploadFile, DownloadFile, VerifyFileExists
- **Assertions**: Exists, NotExists, Property, PropertyContains, Count
- **Utilities**: GenerateId, GetNextSequence, Wait, SetVariable, LogMessage

---

## 3. Implementation Status (Updated)

| Category                    | Status |
| --------------------------- | ------ |
| Connection & Authentication | ✅ Implemented |
| Item CRUD                   | ✅ Implemented |
| Lock Operations             | ✅ Implemented |
| Lifecycle Operations        | ✅ Implemented |
| Relationship Operations     | ✅ Implemented |
| Workflow Operations         | ✅ Implemented |
| AML & SQL Execution         | ✅ Implemented |
| Assertions                  | ✅ Implemented |
| File Vault Operations       | ✅ Implemented |
| Utility Actions             | ✅ Implemented |

**Total**: All mapped categories appear to have controller endpoints.

---

## 4. Backend Contracts & Models

See `docs/facts/FACT_DOMAIN_TERMS.md` for full model definitions.

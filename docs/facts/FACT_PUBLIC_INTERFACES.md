# FACT_PUBLIC_INTERFACES

**Source**: Publicly exposed classes reachable from entry points.
**Extraction Date**: 2026-02-28
**Constraint**: Only method signatures with explicit route attributes. No inferred behaviors.

---

## Backend API Endpoints

**Base URL**: `/api/aras` (declared via `[Route("api/aras")]` on both controllers)

### ConnectionController (`backend/ArasBackend/Controllers/ConnectionController.cs`)
**Inherits**: `ControllerBase`
**Attribute**: `[ApiController]`

| HTTP Method | Route | Method Name | Request Type | Response Type |
|-------------|-------|-------------|--------------|---------------|
| POST | /api/aras/connect | Connect | ConnectionRequest | ConnectionResponse |
| POST | /api/aras/disconnect | Disconnect | (none) | ConnectionResponse |
| POST | /api/aras/disconnect/{sessionName} | DisconnectSession | (string sessionName) | ConnectionResponse |
| GET | /api/aras/sessions | GetAllSessions | (none) | AllSessionsResponse |
| GET | /api/aras/connection-status | GetStatus | (none) | ConnectionStatusResponse |
| GET | /api/aras/validate | Validate | (none) | ConnectionResponse |

### ItemController (`backend/ArasBackend/Controllers/ItemController.cs`)
**Inherits**: `ControllerBase`
**Attribute**: `[ApiController]`

| HTTP Method | Route | Method Name | Request Type | Response Type |
|-------------|-------|-------------|--------------|---------------|
| POST | /api/aras/query | Query | QueryRequest | ItemResponse |
| POST | /api/aras/get-by-id | GetById | GetByIdRequest | ItemResponse |
| POST | /api/aras/get-by-keyed-name | GetByKeyedName | GetByKeyedNameRequest | ItemResponse |
| POST | /api/aras/create | Create | CreateItemRequest | ItemResponse |
| POST | /api/aras/update | Update | UpdateItemRequest | ItemResponse |
| POST | /api/aras/delete | Delete | DeleteItemRequest | ItemResponse |
| POST | /api/aras/purge | Purge | DeleteItemRequest | ItemResponse |
| POST | /api/aras/lock | Lock | LockRequest | ItemResponse |
| POST | /api/aras/unlock | Unlock | LockRequest | ItemResponse |
| POST | /api/aras/check-lock | CheckLock | LockRequest | ItemResponse |
| POST | /api/aras/promote | Promote | PromoteRequest | ItemResponse |
| POST | /api/aras/get-state | GetState | GetByIdRequest | ItemResponse |
| POST | /api/aras/add-relationship | AddRelationship | AddRelationshipRequest | ItemResponse |
| POST | /api/aras/get-relationships | GetRelationships | GetRelationshipsRequest | ItemResponse |
| POST | /api/aras/delete-relationship | DeleteRelationship | DeleteRelationshipRequest | ItemResponse |
| POST | /api/aras/apply-aml | ApplyAml | ApplyAmlRequest | ItemResponse |
| POST | /api/aras/apply-sql | ApplySql | ApplySqlRequest | ItemResponse |
| POST | /api/aras/apply-method | ApplyMethod | ApplyMethodRequest | ItemResponse |
| POST | /api/aras/assert-exists | AssertExists | AssertExistsRequest | AssertionResponse |
| POST | /api/aras/assert-not-exists | AssertNotExists | AssertExistsRequest | AssertionResponse |
| POST | /api/aras/assert-property | AssertProperty | AssertPropertyRequest | AssertionResponse |
| POST | /api/aras/assert-state | AssertState | AssertStateRequest | AssertionResponse |
| POST | /api/aras/start-workflow | StartWorkflow | StartWorkflowRequest | ItemResponse |
| GET | /api/aras/assigned-activities | GetAssignedActivities | (none) | ItemResponse |
| POST | /api/aras/complete-activity | CompleteActivity | CompleteActivityRequest | ItemResponse |
| POST | /api/aras/assert-property-contains | AssertPropertyContains | AssertPropertyContainsRequest | AssertionResponse |
| POST | /api/aras/assert-count | AssertCount | AssertCountRequest | AssertionResponse |
| POST | /api/aras/assert-locked | AssertLocked | LockRequest | AssertionResponse |
| POST | /api/aras/assert-unlocked | AssertUnlocked | LockRequest | AssertionResponse |
| POST | /api/aras/upload-file | UploadFile | UploadFileRequest | ItemResponse |
| POST | /api/aras/download-file | DownloadFile | DownloadFileRequest | ItemResponse |
| POST | /api/aras/verify-file-exists | VerifyFileExists | VerifyFileExistsRequest | AssertionResponse |
| POST | /api/aras/generate-id | GenerateId | (none) | ItemResponse |
| POST | /api/aras/get-next-sequence | GetNextSequence | GetNextSequenceRequest | ItemResponse |
| POST | /api/aras/wait | Wait | WaitRequest | ItemResponse |
| POST | /api/aras/set-variable | SetVariable | SetVariableRequest | ItemResponse |
| POST | /api/aras/log-message | LogMessage | LogMessageRequest | ItemResponse |

### Inline Mapped Endpoint (`backend/ArasBackend/Program.cs`)
| HTTP Method | Route | Response |
|-------------|-------|----------|
| GET | /api/status | `{ status, timestamp }` |

---

## ArasGateway (`backend/ArasBackend.Infrastructure/Gateways/ArasGateway.cs`)
**Implements**: `IArasGateway`

_(Note: Gateway implementation details not verified in this pass, derived from Controller usage)_

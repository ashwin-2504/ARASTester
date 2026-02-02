# FACT_PUBLIC_INTERFACES

**Source**: Publicly exposed classes reachable from entry points.
**Extraction Date**: 2026-01-20
**Constraint**: Only method signatures with explicit route attributes. No inferred behaviors.

---

## Backend API Endpoints

**Base URL**: `/api/aras` (declared via `[Route("api/aras")]` on both controllers)

### ConnectionController (`backend/ArasBackend/Controllers/ConnectionController.cs`)
**Inherits**: `ControllerBase`
**Attribute**: `[ApiController]`

| HTTP Method | Route | Method Name | Request Type | Response Type | Line |
|-------------|-------|-------------|--------------|---------------|------|
| POST | /api/aras/connect | Connect | ConnectionRequest | ConnectionResponse | 18-23 |
| POST | /api/aras/disconnect | Disconnect | (none) | ConnectionResponse | 25-30 |
| GET | /api/aras/connection-status | GetStatus | (none) | ConnectionStatusResponse | 32-37 |
| GET | /api/aras/validate | Validate | (none) | ConnectionResponse | 39-44 |

### ItemController (`backend/ArasBackend/Controllers/ItemController.cs`)
**Inherits**: `ControllerBase`
**Attribute**: `[ApiController]`

| HTTP Method | Route | Method Name | Request Type | Response Type | Line |
|-------------|-------|-------------|--------------|---------------|------|
| POST | /api/aras/query | Query | QueryRequest | ItemResponse | 18-19 |
| POST | /api/aras/get-by-id | GetById | GetByIdRequest | ItemResponse | 21-22 |
| POST | /api/aras/get-by-keyed-name | GetByKeyedName | GetByKeyedNameRequest | ItemResponse | 24-25 |
| POST | /api/aras/create | Create | CreateItemRequest | ItemResponse | 27-28 |
| POST | /api/aras/update | Update | UpdateItemRequest | ItemResponse | 30-31 |
| POST | /api/aras/delete | Delete | DeleteItemRequest | ItemResponse | 33-34 |
| POST | /api/aras/purge | Purge | DeleteItemRequest | ItemResponse | 36-37 |
| POST | /api/aras/lock | Lock | LockRequest | ItemResponse | 39-40 |
| POST | /api/aras/unlock | Unlock | LockRequest | ItemResponse | 42-43 |
| POST | /api/aras/check-lock | CheckLock | LockRequest | ItemResponse | 45-46 |
| POST | /api/aras/promote | Promote | PromoteRequest | ItemResponse | 48-49 |
| POST | /api/aras/get-state | GetState | GetByIdRequest | ItemResponse | 51-52 |
| POST | /api/aras/add-relationship | AddRelationship | AddRelationshipRequest | ItemResponse | 54-55 |
| POST | /api/aras/get-relationships | GetRelationships | GetRelationshipsRequest | ItemResponse | 57-58 |
| POST | /api/aras/delete-relationship | DeleteRelationship | DeleteRelationshipRequest | ItemResponse | 60-61 |
| POST | /api/aras/apply-aml | ApplyAml | ApplyAmlRequest | ItemResponse | 63-64 |
| POST | /api/aras/apply-sql | ApplySql | ApplySqlRequest | ItemResponse | 66-67 |
| POST | /api/aras/apply-method | ApplyMethod | ApplyMethodRequest | ItemResponse | 69-70 |
| POST | /api/aras/assert-exists | AssertExists | AssertExistsRequest | AssertionResponse | 73-74 |
| POST | /api/aras/assert-not-exists | AssertNotExists | AssertExistsRequest | AssertionResponse | 76-77 |
| POST | /api/aras/assert-property | AssertProperty | AssertPropertyRequest | AssertionResponse | 79-80 |
| POST | /api/aras/assert-state | AssertState | AssertStateRequest | AssertionResponse | 82-83 |

### Inline Mapped Endpoint (`backend/ArasBackend/Program.cs`)
| HTTP Method | Route | Response | Line |
|-------------|-------|----------|------|
| GET | /api/status | `{ status, timestamp }` | 39-42 |

---

## ArasGateway (`backend/ArasBackend.Infrastructure/Gateways/ArasGateway.cs`)
**Implements**: `IArasGateway` (inferred from `: IArasGateway` line 10)

| Method | Parameter Type | Return Type | Lines |
|--------|----------------|-------------|-------|
| QueryItems | QueryRequest | ItemResponse | 44-70 |
| GetItemById | GetByIdRequest | ItemResponse | 72-84 |
| GetItemByKeyedName | GetByKeyedNameRequest | ItemResponse | 86-89 |
| CreateItem | CreateItemRequest | ItemResponse | 91-100 |
| UpdateItem | UpdateItemRequest | ItemResponse | 102-112 |
| DeleteItem | DeleteItemRequest | ItemResponse | 114-122 |
| PurgeItem | DeleteItemRequest | ItemResponse | 124-132 |
| LockItem | LockRequest | ItemResponse | 134-142 |
| UnlockItem | LockRequest | ItemResponse | 144-152 |
| CheckLockStatus | LockRequest | ItemResponse | 154-175 |
| AddRelationship | AddRelationshipRequest | ItemResponse | 177-192 |
| GetRelationships | GetRelationshipsRequest | ItemResponse | 194-205 |
| DeleteRelationship | DeleteRelationshipRequest | ItemResponse | 207-215 |
| PromoteItem | PromoteRequest | ItemResponse | 217-228 |
| GetCurrentState | GetByIdRequest | ItemResponse | 230-251 |
| ApplyAML | ApplyAmlRequest | ItemResponse | 253-261 |
| ApplySQL | ApplySqlRequest | ItemResponse | 263-266 |
| ApplyMethod | ApplyMethodRequest | ItemResponse | 268-271 |
| AssertItemExists | AssertExistsRequest | AssertionResponse | 273-291 |
| AssertItemNotExists | AssertExistsRequest | AssertionResponse | 293-311 |
| AssertPropertyValue | AssertPropertyRequest | AssertionResponse | 313-329 |
| AssertState | AssertStateRequest | AssertionResponse | 331-347 |

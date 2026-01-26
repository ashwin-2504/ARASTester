# API_REFERENCE

> ⚠ HUMAN REVIEW REQUIRED
>
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-20
**Base URL**: `http://localhost:5000/api/aras`

---

## Connection Endpoints

### POST /connect

Establish connection to ARAS Innovator server.

- **Side Effect**: Creates a process-scoped `HttpServerConnection`. Adds session to the active pool.
- **Behavior**: Validates credentials immediately. Returns `ServerInfo` on success.

**Request:**

```json
{
  "url": "http://localhost/InnovatorServer/Server/InnovatorServer.aspx",
  "database": "InnovatorSolutions",
  "username": "admin",
  "password": "innovator",
  "sessionName": "Primary_Session"
}
```

_(Note: `sessionName` is optional but recommended for multi-session support)_

**Response (Success):**

```json
{
  "Success": true,
  "Message": "Successfully connected",
  "ServerInfo": {
    "Database": "InnovatorSolutions",
    "UserId": "30B991F927EB4F55B....",
    "UserName": "admin",
    "Url": "http://localhost/InnovatorServer/..."
  },
  "SessionName": "Primary_Session"
}
```

**Response (Error):**

```json
{
  "Success": false,
  "Message": "Login failed: Invalid username or password",
  "Timestamp": "2026-01-20T10:00:00Z"
}
```

---

### GET /sessions

Retrieve list of all active sessions.

- **Guarantee**: Returns the _current real-time_ state of the backend session pool. Frontend **MUST** use this to sync.
- **Authorization Scope**: Global. Returns ALL sessions active on the backend process, regardless of who created them.

**Response:**

```json
{
  "sessions": [
    {
      "name": "Primary_Session",
      "serverInfo": { ... },
      "isCurrent": true
    }
  ],
  "currentSession": "Primary_Session"
}
```

---

### POST /disconnect

Close session and release resources.

- **Idempotency**: Safe to call multiple times. Returns Success=True if session is already gone.
- **Side Effect**: Invalidates IOM connection and removes from pool.

**Request:**

```json
{
  "sessionName": "Primary_Session" // Optional. If omitted, disconnects current.
}
```

**Response:**

```json
{
  "Success": true,
  "Message": "Disconnected"
}
```

---

### GET /validate

(Legacy) Test if current default connection is valid.

**Response:**

```json
{
  "Success": true,
  "Message": "Valid. User: Admin",
  "ServerInfo": { ... }
}
```

---

### GET /connection-status

Get current connection state.

**Response:**

```json
{
  "IsConnected": true,
  "Status": "Connected",
  "ServerInfo": { ... }
}
```

---

## Item CRUD Endpoints

### POST /query

Query items by criteria with pagination.

**Request:**

```json
{
  "itemType": "Part",
  "select": "item_number,name,state",
  "criteria": {
    "item_number": "ABC%"
  },
  "page": 1,
  "pageSize": 25
}
```

**Response:**

```json
{
  "Success": true,
  "Message": "Query successful",
  "ItemCount": 5,
  "Data": "<AML>...</AML>"
}
```

---

### POST /get-by-id

Get single item by ID.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890",
  "select": "item_number,name,state"
}
```

---

### POST /get-by-keyed-name

Get item by its keyed name.

**Request:**

```json
{
  "itemType": "Part",
  "keyedName": "PART-001"
}
```

---

### POST /create

Create a new item.

**Request:**

```json
{
  "itemType": "Part",
  "properties": {
    "item_number": "NEW-001",
    "name": "New Part",
    "description": "Created via ARASTester"
  }
}
```

**Response:**

```json
{
  "Success": true,
  "Message": "Item created successfully",
  "ItemCount": 1,
  "Data": "<AML><Item id='...' /></AML>"
}
```

---

### POST /update

Update an existing item.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890",
  "properties": {
    "name": "Updated Name",
    "description": "Modified via ARASTester"
  }
}
```

---

### POST /delete

Delete item (current version).

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890"
}
```

---

### POST /purge

Permanently remove all versions.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890"
}
```

---

## Lock Endpoints

### POST /lock

Lock item for editing.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890"
}
```

---

### POST /unlock

Release lock.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890"
}
```

---

### POST /check-lock

Check lock status.

**Response:**

```json
{
  "Success": true,
  "Message": "Item is locked",
  "Data": {
    "isLocked": true,
    "lockedById": "USER_ID_HERE"
  }
}
```

---

## Lifecycle Endpoints

### POST /promote

Promote item to new lifecycle state.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ABCDEF1234567890ABCDEF1234567890",
  "targetState": "Released",
  "comments": "Approved for production"
}
```

---

### POST /get-state

Get current lifecycle state.

**Response:**

```json
{
  "Success": true,
  "Message": "Current state: Preliminary",
  "Data": {
    "state": "Preliminary"
  }
}
```

---

## Relationship Endpoints

### POST /add-relationship

Create relationship between items.

**Request:**

```json
{
  "parentType": "Part",
  "parentId": "PARENT_ID",
  "relationshipType": "Part BOM",
  "relatedId": "CHILD_ID",
  "properties": {
    "quantity": "5"
  }
}
```

---

### POST /get-relationships

Get relationships for an item.

**Request:**

```json
{
  "itemType": "Part",
  "id": "PARENT_ID",
  "relationshipType": "Part BOM",
  "select": "quantity,related_id(item_number,name)"
}
```

---

### POST /delete-relationship

Remove a relationship.

**Request:**

```json
{
  "relationshipType": "Part BOM",
  "relationshipId": "RELATIONSHIP_ITEM_ID"
}
```

---

## AML & SQL Endpoints

### POST /apply-aml

Execute raw AML query.

**Request:**

```json
{
  "aml": "<Item type='Part' action='get' select='item_number,name'><state>Released</state></Item>"
}
```

---

### POST /apply-sql

Execute SQL query.

**Request:**

```json
{
  "sql": "SELECT id, item_number, name FROM innovator.PART WHERE state = 'Released'"
}
```

---

### POST /apply-method

Call server method.

**Request:**

```json
{
  "methodName": "MyServerMethod",
  "body": "<param1>value1</param1>"
}
```

---

## Assertion Endpoints

### POST /assert-exists

Verify item exists.

**Request:**

```json
{
  "itemType": "Part",
  "criteria": {
    "item_number": "PART-001"
  }
}
```

**Response (Pass):**

```json
{
  "Success": true,
  "Passed": true,
  "Message": "Found 1 matching item(s)",
  "ActualValue": "1",
  "ExpectedValue": ">0"
}
```

---

### POST /assert-not-exists

Verify item doesn't exist.

**Request:**

```json
{
  "itemType": "Part",
  "criteria": {
    "item_number": "DELETED-001"
  }
}
```

---

### POST /assert-property

Check property equals expected value.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ITEM_ID",
  "property": "state",
  "expected": "Released"
}
```

---

### POST /assert-state

Verify lifecycle state.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ITEM_ID",
  "expectedState": "Released"
}
```

**Response (Fail):**

```json
{
  "Success": true,
  "Passed": false,
  "Message": "Expected state 'Released' but got 'Preliminary'",
  "ActualValue": "Preliminary",
  "ExpectedValue": "Released"
}
```

---

## Error Response Format

All endpoints return errors in this format:

```json
{
  "Success": false,
  "Message": "Error description",
  "Detail": "Optional technical details",
  "Timestamp": "2026-01-20T10:00:00Z"
}
```

| HTTP Status | Meaning               |
| ----------- | --------------------- |
| 401         | Authentication failed |
| 400         | Validation error      |
| 404         | Item not found        |
| 502         | ARAS server error     |
| 500         | Internal server error |

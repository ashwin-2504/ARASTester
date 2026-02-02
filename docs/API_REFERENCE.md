# API_REFERENCE

> ⚠ HUMAN REVIEW REQUIRED
>
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-02-28
**Base URL**: `http://localhost:5000/api/aras`

---

## Connection Endpoints

### POST /connect

Establish connection to ARAS Innovator server.

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

**Response (Success):**

```json
{
  "Success": true,
  "Message": "Successfully connected",
  "ServerInfo": { ... },
  "SessionName": "Primary_Session"
}
```

---

### GET /sessions

Retrieve list of all active sessions.

**Response:**

```json
{
  "sessions": [ ... ],
  "currentSession": "Primary_Session"
}
```

---

### POST /disconnect

Disconnect the current session.

**Response:**

```json
{
  "Success": true,
  "Message": "Disconnected"
}
```

---

### POST /disconnect/{sessionName}

Disconnect a specific session by name.

**Response:**

```json
{
  "Success": true,
  "Message": "Session 'Primary_Session' disconnected"
}
```

---

### GET /connection-status

Get current connection state.

---

### GET /validate

Test if current default connection is valid.

---

## Item CRUD Endpoints

### POST /query

Query items by criteria with pagination.

**Request:**

```json
{
  "itemType": "Part",
  "select": "item_number,name",
  "criteria": { "item_number": "ABC%" },
  "page": 1,
  "pageSize": 25
}
```

---

### POST /get-by-id

Get single item by ID.

---

### POST /get-by-keyed-name

Get item by its keyed name.

---

### POST /create

Create a new item.

---

### POST /update

Update an existing item.

---

### POST /delete

Delete item (current version).

---

### POST /purge

Permanently remove all versions.

---

## Lock Endpoints

### POST /lock
### POST /unlock
### POST /check-lock

---

## Lifecycle Endpoints

### POST /promote
### POST /get-state

---

## Relationship Endpoints

### POST /add-relationship
### POST /get-relationships
### POST /delete-relationship

---

## AML & SQL Endpoints

### POST /apply-aml
### POST /apply-sql
### POST /apply-method

---

## Workflow Operations

### POST /start-workflow

Start a workflow for an item.

**Request:**

```json
{
  "itemType": "Part",
  "id": "ITEM_ID",
  "workflowMapId": "MAP_ID"
}
```

### GET /assigned-activities

Get activities assigned to the current user.

### POST /complete-activity

Complete an activity (vote).

**Request:**

```json
{
  "activityId": "ACTIVITY_ID",
  "path": "Submit",
  "variables": { "comments": "Done" }
}
```

---

## File Operations

### POST /upload-file
### POST /download-file
### POST /verify-file-exists

---

## Assertion Endpoints

### POST /assert-exists
### POST /assert-not-exists
### POST /assert-property
### POST /assert-state
### POST /assert-property-contains
### POST /assert-count
### POST /assert-locked
### POST /assert-unlocked

---

## Utility Operations

### POST /generate-id
### POST /get-next-sequence
### POST /wait
### POST /set-variable
### POST /log-message

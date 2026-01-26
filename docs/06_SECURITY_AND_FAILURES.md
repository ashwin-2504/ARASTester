# 06_SECURITY_AND_FAILURES

> ⚠ HUMAN REVIEW REQUIRED
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-20
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Security Mechanisms (Code-Enforced Only)

> **Disclaimer**: Absence of security mechanisms in code does not imply system insecurity; only code-level observations are documented.

### 1.1 CORS Policy

**File**: `backend/ArasBackend/Program.cs` Lines 9-20

| Setting | Value |
|---------|-------|
| Allowed Origins | `http://localhost:3000`, `http://localhost:5173` |
| Origin Validation | `new Uri(origin).Host == "localhost"` |
| Allowed Headers | Any |
| Allowed Methods | Any |
| Allow Credentials | Yes |

### 1.2 Content Security Policy (CSP)

**File**: `index.html` Lines 7-10

| Directive | Value |
|-----------|-------|
| script-src | 'self' |
| object-src | 'none' |

### 1.3 Electron Security Settings

**File**: `main.js` Lines 14-18

| Setting | Value |
|---------|-------|
| contextIsolation | true |
| nodeIntegration | false |
| preload | preload.js |

### 1.4 HTTPS Redirection

**File**: `Program.cs` Lines 31-34

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
```

> HTTPS enforced only in non-development environment.

---

## 2. Authentication

> ⚠ **NOT FOUND IN CODEBASE**

No authentication middleware, token validation, or user identity verification was found in the backend code.

**Security Assumption**: The application relies on ARAS Innovator server for authentication. The `ConnectionRequest` contains username/password which is passed to `IomFactory.CreateHttpServerConnection()`.

---

## 3. Authorization

> ⚠ **NOT FOUND IN CODEBASE**

No role-based access control (RBAC), policy-based authorization, or endpoint-level authorization attributes were found.

---

## 4. Input Validation

**Observed Validation**:

| Location | Validation | File/Line |
|----------|------------|-----------|
| ApplyAML | Wraps AML in `<AML>` tags if not present | ArasGateway.cs Lines 256-259 |
| Request Models | `required` keyword on properties | ArasModels.cs (multiple) |

> ⚠ No explicit input sanitization or SQL injection prevention observed. Backend relies on ARAS IOM SDK behavior.

---

## 5. Error Handling

### 5.1 Global Exception Middleware

**File**: [ExceptionHandlingMiddleware.cs](../backend/ArasBackend/Middleware/ExceptionHandlingMiddleware.cs)

The middleware catches all unhandled exceptions and returns structured JSON responses.

#### Exception Types (from `ArasExceptions.cs`)

| Exception | HTTP Status | Use Case |
|-----------|-------------|----------|
| `ArasAuthException` | 401 Unauthorized | Login failure, session expired |
| `ArasNotFoundException` | 404 Not Found | Item not found |
| `ArasValidationException` | 400 Bad Request | Invalid input parameters |
| `ArasInfrastructureException` | 502 Bad Gateway | ARAS server unreachable |
| `Exception` (default) | 500 Internal Server Error | Unhandled errors |

#### Error Response Format

```json
{
  "Success": false,
  "Message": "Human-readable error message",
  "Detail": "Optional technical details (only for infrastructure errors)",
  "Timestamp": "2026-01-20T10:00:00Z"
}
```

#### Security Note (Line 68-70)
```csharp
response.Message = "An internal server error occurred.";
// In production, don't expose stack trace/details
// response.Detail = exception.Message;
```
✅ Generic message returned for unknown exceptions (stack traces hidden)

### 5.2 Gateway-Level Error Handling

**File**: `ArasGateway.cs` Lines 24-26

```csharp
if (result.isError())
{
    return new ItemResponse { Success = false, Message = result.getErrorString() };
}
```

**Pattern**: All gateway methods check `result.isError()` after `apply()` calls.

---

## 6. Known Security Gaps

| Gap | Observation |
|-----|-------------|
| No Auth Middleware | API endpoints are not protected by authentication |
| CORS Localhost Only | Only localhost origins allowed; production configuration unknown |
| Password Handling | Password stored in `ConnectionRequest` model; no encryption observed in transit to backend |
| Error Exposure | Full ARAS error strings returned in responses |

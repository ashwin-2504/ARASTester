# 06_SECURITY_AND_FAILURES

> ⚠ HUMAN REVIEW REQUIRED
>
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-28
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Security Mechanisms (Code-Enforced Only)

> **Disclaimer**: Absence of security mechanisms in code does not imply system insecurity; only code-level observations are documented.

### 1.1 CORS Policy

**File**: `backend/ArasBackend/Program.cs`

| Setting           | Value                                            |
| ----------------- | ------------------------------------------------ |
| Allowed Origins   | `http://localhost:3000`, `http://localhost:5173` |
| Origin Validation | `new Uri(origin).Host == "localhost"`            |
| Allowed Headers   | Any                                              |
| Allowed Methods   | Any                                              |
| Allow Credentials | Yes                                              |

### 1.2 Content Security Policy (CSP)

**File**: `index.html`

| Directive  | Value  |
| ---------- | ------ |
| script-src | 'self' |
| object-src | 'none' |

### 1.3 Electron Security Settings

**File**: `main.js`

| Setting          | Value      |
| ---------------- | ---------- |
| contextIsolation | true       |
| nodeIntegration  | false      |
| preload          | preload.js |

### 1.4 HTTPS Redirection

**File**: `Program.cs`

```csharp
if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}
```

---

## 2. Authentication

> ⚠ **NOT FOUND IN CODEBASE**

No dedicated authentication middleware (like Identity or JWT) is implemented.

**Security Assumption**: The application relies on ARAS Innovator server for authentication. The `ConnectionRequest` contains credentials which are verified via `IOM` during the `/connect` call.

---

## 3. Authorization

> ⚠ **NOT FOUND IN CODEBASE**

No role-based access control (RBAC) or policy-based authorization were found.

---

## 4. Input Validation

**Observed Validation**:

| Location       | Validation                               | File           |
| -------------- | ---------------------------------------- | -------------- |
| ApplyAML       | Wraps AML in `<AML>` tags if not present | ArasGateway.cs |
| Request Models | `required` keyword on properties         | ArasModels.cs  |

---

## 5. Error Handling

### 5.1 Global Exception Middleware

**File**: [ExceptionHandlingMiddleware.cs](../backend/ArasBackend/Middleware/ExceptionHandlingMiddleware.cs)

The middleware catches all unhandled exceptions and returns structured JSON responses.

#### Exception Types (from `ArasExceptions.cs`)

| Exception                     | HTTP Status               | Use Case                       |
| ----------------------------- | ------------------------- | ------------------------------ |
| `ArasAuthException`           | 401 Unauthorized          | Login failure, session expired |
| `ArasNotFoundException`       | 404 Not Found             | Item not found                 |
| `ArasValidationException`     | 400 Bad Request           | Invalid input parameters       |
| `ArasInfrastructureException` | 502 Bad Gateway           | ARAS server unreachable        |
| `Exception` (default)         | 500 Internal Server Error | Unhandled internal errors      |

#### Error Response Format

```json
{
  "Success": false,
  "Message": "Human-readable error message",
  "Detail": "Optional technical details (Infrastructure only)",
  "Timestamp": "2026-01-28T10:00:00Z"
}
```

#### Security Note

✅ Generic message returned for unknown internal exceptions; stack traces are hidden in the response.

### 5.2 Gateway-Level Error Handling

**File**: `ArasGateway.cs`

```csharp
if (result.isError())
{
    return new ItemResponse { Success = false, Message = result.getErrorString() };
}
```

---

## 6. Known Security Gaps

| Gap                 | Observation                                          |
| ------------------- | ---------------------------------------------------- |
| No Auth Middleware  | API endpoints are open if the port is exposed        |
| CORS Localhost Only | Hardcoded to localhost; needs config for deployment  |
| Password Handling   | Cleartext in JSON request body                       |
| Error Exposure      | ARAS error strings are returned directly to frontend |

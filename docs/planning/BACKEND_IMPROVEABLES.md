# BACKEND IMPROVEABLES

Last reviewed: 2026-03-07  
Scope: `backend/**` ASP.NET Core API, session lifecycle, gateway execution model, and failure handling.

## Priority 0 (Fix Immediately)

1. CORS configuration key mismatch can silently break production
- Evidence:
  - `backend/ArasBackend/Program.cs:11` reads `Cors:AllowedOrigins`.
  - `backend/ArasBackend/appsettings.json:9` defines `AllowedOrigins` (not nested under `Cors`).
- Risk:
  - Production can run with empty allowed origins, causing failed calls and hard-to-diagnose connectivity errors.
- Improvement:
  - Align config shape (`Cors:AllowedOrigins`) or read `AllowedOrigins`.
  - Validate at startup and fail fast when required origins are missing.

2. Session replacement leaks old connections
- Evidence: `backend/ArasBackend.Infrastructure/Services/InMemoryConnectionStore.cs:17` overwrites `_sessions[name] = session` without disposing prior session.
- Risk:
  - Reconnecting with the same session name can leave previous `HttpServerConnection` alive.
- Improvement:
  - Use `AddOrUpdate` and explicitly `Logout()`/dispose prior connection before replacement.

3. Blocking logout in request path with swallowed errors
- Evidence:
  - `backend/ArasBackend.Infrastructure/Services/InMemoryConnectionStore.cs:55` calls `session.Connection.Logout()` inline.
  - `catch { }` swallows all exceptions.
- Risk:
  - Slow/hung logout increases API latency; silent failures hide resource leaks.
- Improvement:
  - Add structured logging on logout failure.
  - Consider timeout/async isolation for logout path.

## Priority 1 (High Value: Throughput + Reliability)

4. `Task.Run` wrapping for every IOM call adds scheduling overhead and weak cancellation semantics
- Evidence:
  - `backend/ArasBackend.Infrastructure/Gateways/BaseGateway.cs:49`
  - `backend/ArasBackend.Infrastructure/Services/ArasSessionManager.cs:82`
  - `backend/ArasBackend.Infrastructure/Gateways/BaseGateway.cs:48` notes IOM is not cancellable once started.
- Risk:
  - Extra thread-pool churn under load and operations continue running after client disconnect.
- Improvement:
  - Use one execution model consistently:
    - either synchronous execution on request thread, or
    - a bounded dedicated worker queue for IOM calls (recommended for isolation).
  - Propagate cancellation only before queue/start.

5. Session cleanup strategy has race-prone timing and hot-path overhead
- Evidence:
  - `backend/ArasBackend.Infrastructure/Services/InMemoryConnectionStore.cs:11`, `:72-74` mutate `_lastCleanup` without synchronization.
  - Cleanup invoked on `AddSession`, `GetSession`, and `GetAllSessions`.
- Risk:
  - Redundant cleanups under concurrent traffic; timing races.
- Improvement:
  - Move cleanup to hosted background service (`IHostedService`) with fixed cadence.
  - Keep store operations O(1) without periodic LINQ scans in request path.

6. Expensive full XML serialization on nearly every successful IOM response
- Evidence: `backend/ArasBackend.Infrastructure/Gateways/BaseGateway.cs:33` sets `Data = result.dom?.OuterXml`.
- Risk:
  - Large payload allocations, serialization overhead, GC pressure, slower responses.
- Improvement:
  - Return shaped DTOs for common operations, not raw `OuterXml`.
  - Make raw XML opt-in (debug flag / dedicated endpoint).

7. Unbounded per-session memory growth
- Evidence:
  - `backend/ArasBackend.Infrastructure/Services/ConnectionStore.cs:14` `Variables` dictionary
  - `backend/ArasBackend.Infrastructure/Services/ConnectionStore.cs:15` `TestLogs` list
- Risk:
  - Long-lived sessions can grow memory indefinitely.
- Improvement:
  - Set caps (for example max log entries, max variable keys/size).
  - Add eviction policy and telemetry for dropped entries.

## Priority 2 (Failure Contracts + Operability)

8. Error responses are custom JSON, not standardized ProblemDetails
- Evidence:
  - `backend/ArasBackend/Middleware/ExceptionHandlingMiddleware.cs:34`
  - `backend/ArasBackend/Middleware/ExceptionHandlingMiddleware.cs:87`
- Risk:
  - Inconsistent client handling and weaker observability tooling integration.
- Improvement:
  - Use ASP.NET Core ProblemDetails (`AddProblemDetails`, `UseExceptionHandler`) and include trace/correlation IDs.

9. Cookie name is duplicated and can drift from configured session names
- Evidence:
  - `backend/ArasBackend/Controllers/ConnectionController.cs:37`, `:49`, `:63` hardcode `"ARAS_SESSION_ID"`.
  - `backend/ArasBackend/Services/WebSessionContext.cs:19-20` reads cookie/header names from config.
- Risk:
  - Config changes won’t apply consistently; intermittent auth/session failures.
- Improvement:
  - Inject options and use one shared source for cookie/header names.

10. `Wait` endpoint allows extreme durations
- Evidence:
  - `backend/ArasBackend.Core/Models/ArasModels.cs:292-293` `[Range(0, int.MaxValue)]`
  - `backend/ArasBackend.Infrastructure/Gateways/UtilityGateway.cs:63` `Task.Delay(request.Duration, ...)`
- Risk:
  - Very long requests consume server resources and can be abused.
- Improvement:
  - Cap duration to safe upper bound (for example 30s or 60s).
  - Add request-level timeout/rate limit for utility endpoints.

11. Operational surface is missing built-in diagnostics despite package investment
- Evidence:
  - `backend/ArasBackend/ArasBackend.csproj:21` includes `Swashbuckle.AspNetCore`.
  - `backend/ArasBackend/Program.cs` has no `AddSwaggerGen`/`UseSwagger`.
- Risk:
  - Harder debugging and contract validation for a large API surface.
- Improvement:
  - Enable Swagger/OpenAPI in Development only.
  - Add health checks endpoint (`/health`) for backend and ARAS connectivity probe.

## Priority 3 (Security/Guardrails that also reduce failure blast radius)

12. High-risk raw execution endpoints lack guardrails (`apply-sql`, `apply-aml`, `apply-method`)
- Evidence:
  - `backend/ArasBackend.Infrastructure/Gateways/UtilityGateway.cs:16`, `:29`, `:34`
  - Routed by `ItemController` endpoints.
- Risk:
  - Accidental destructive operations and hard-to-recover failures.
- Improvement:
  - Feature-flag these endpoints.
  - Restrict by environment/role/profile.
  - Add audit logging for payload metadata and execution outcome.

## Suggested Implementation Order

1. Fix correctness and leak risks: items 1, 2, 3, 9.
2. Improve throughput and load behavior: items 4, 5, 6, 7.
3. Harden operability contracts: items 8, 11.
4. Limit abuse/failure blast radius: items 10, 12.

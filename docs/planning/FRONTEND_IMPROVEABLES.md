# FRONTEND IMPROVEABLES

Last reviewed: 2026-03-07  
Scope: `renderer/**` frontend architecture, state, execution flow, and UI performance.

## Priority 0 (Fix First)

1. Global request cancellation can break unrelated screens
- Evidence: `renderer/routes/PlanDetails/usePlanDetails.ts:28` calls `apiClient.cancelAll()` on unmount.
- Risk: Leaving Plan Details can cancel unrelated in-flight requests (for example status polling), causing random UI failures.
- Improvement:
  - Replace global `cancelAll()` usage with scoped request IDs (per page/session).
  - Add `cancelByPrefix(prefix)` in `apiClient` and use a page-level prefix.

2. API client assumes every response is JSON
- Evidence: `renderer/core/api/client.ts:154`, `renderer/core/api/client.ts:198` unconditionally call `response.json()`.
- Risk: Non-JSON or empty responses (204/no body, proxy errors, HTML errors) throw parse errors and mask the real HTTP failure.
- Improvement:
  - Parse by `content-type` and body length.
  - Support empty responses safely.
  - Keep original status/message when parsing fails.

3. Duplicate toast containers
- Evidence: `renderer/app/App.tsx:69` and `renderer/layouts/AppShell.tsx:21` both render `<Toaster />`.
- Risk: duplicate notifications, extra render overhead, inconsistent UX.
- Improvement:
  - Keep a single global toaster in one location only.

## Priority 1 (High Value)

4. Tree rendering defeats memoization and scales poorly
- Evidence:
  - `renderer/components/TestTree.tsx:160` creates new `test` object every render.
  - `renderer/components/tree/TestNode.tsx:180` creates new `action` object every render.
  - `renderer/components/TestTree.tsx:112` recomputes status by scanning child actions on each render.
- Risk: large plans re-render deeply and feel slow while editing or logging.
- Improvement:
  - Compute status once in memoized selectors (`useMemo`) keyed by `logs` + ids.
  - Pass stable references to `TestNode`/`ActionNode`.
  - Use stable keys only (`testID`, `actionID`), remove index fallback (`renderer/components/TestTree.tsx:159`).

5. Over-fetching dashboard plans after every mutation
- Evidence: repeated full `loadPlans()` calls in `renderer/routes/Dashboard/useDashboard.ts:65`, `:80`, `:95`.
- Risk: unnecessary disk I/O and slower dashboard interactions.
- Improvement:
  - Update cache incrementally with `usePlanCacheStore.updatePlan/removePlan`.
  - Use `isStale()` TTL before reloading the full list.

6. Media query hook re-subscribes unnecessarily
- Evidence: `renderer/lib/hooks/useMediaQuery.ts:18` dependency array includes `matches`.
- Risk: repeated listener add/remove cycles; avoidable churn.
- Improvement:
  - Depend only on `query`.
  - Use functional `setMatches` in the event handler.

7. Confirmation dialog store is single-slot and race-prone
- Evidence: `renderer/lib/hooks/useConfirmDialog.ts` stores one `resolve`.
- Risk: concurrent confirmations overwrite each other and can resolve the wrong promise.
- Improvement:
  - Enforce single-flight guard or queue confirmations.
  - Reject/resolve prior pending dialog when a new one is opened.

## Priority 2 (Correctness + Reliability)

8. Mutable normalization of loaded plans
- Evidence: `renderer/routes/PlanDetails/hooks/usePlanState.ts:21-33` mutates `data` in `ensureIds`.
- Risk: hidden side effects and harder debugging if the same object reference is reused.
- Improvement:
  - return a cloned normalized plan; avoid mutating adapter output.

9. Save status timeout not lifecycle-safe
- Evidence: `renderer/routes/PlanDetails/hooks/usePlanState.ts:58` uses `setTimeout` without cleanup.
- Risk: state update after unmount warnings and subtle memory leaks.
- Improvement:
  - track timeout id in `ref` and clear on unmount.

10. Port configuration drift between Electron and frontend
- Evidence:
  - backend spawn uses `BACKEND_PORT` in `main.js:190`.
  - frontend defaults to `http://localhost:5000` in `renderer/core/api/client.ts:1`.
- Risk: backend and frontend can silently target different ports.
- Improvement:
  - establish one source of truth (`VITE_API_URL` or injected runtime config).

11. Backend status poll is constant and unconditional
- Evidence: `renderer/components/BackendStatus.tsx:24` polls every 10s forever.
- Risk: wasteful network calls when app is hidden/offline; no backoff.
- Improvement:
  - pause when document hidden.
  - exponential backoff while offline.
  - optional shared status store to avoid repeated polling from multiple mounts.

## Priority 3 (Type Safety and Maintainability)

12. `any` is widespread in critical paths
- Evidence:
  - `renderer/components/schema/SchemaFormRenderer.tsx:7,8,62,89,104`
  - `renderer/routes/PlanDetails/PlanDetailsPage.tsx:242,244,249`
  - `renderer/core/adapters/StorageService.ts:11`
  - `renderer/types/plan.ts:2,46,73,74`
- Risk: silent runtime errors, weak editor tooling, fragile refactors.
- Improvement:
  - replace `any` with `unknown` + narrowed types.
  - type action params by schema-discriminated unions over time.

13. Local ad-hoc Button in page-level file
- Evidence: custom button implementation in `renderer/routes/PlanDetails/PlanDetailsPage.tsx:242+`.
- Risk: visual/behavior drift from shared UI primitives and more maintenance.
- Improvement:
  - replace with shared `components/ui/button`.

14. Inconsistent TS/JS migration in app shell paths
- Evidence: `renderer/app/App.tsx:36` imports `SettingsPage.jsx` while app is TS-first.
- Risk: weaker static checks in one of the top-level routes.
- Improvement:
  - complete route-level TypeScript migration.

## Speed-Focused Enhancements (Next)

1. Route-level code splitting
- Evidence: `renderer/app/App.tsx:34-36` eagerly imports heavy route pages.
- Improvement:
  - `React.lazy` + `Suspense` for Dashboard/PlanDetails/Settings.

2. Virtualize large test/action trees
- Target: `TestTree`, `TestNode`, `ActionNode`.
- Improvement:
  - windowing (`react-window`/`react-virtualized`) for large plans.

3. Avoid full-object rewrites in hot paths
- Target: `usePlanState.updateItem`, editor change handlers.
- Improvement:
  - fine-grained updates and selector-based subscriptions.

4. Batch execution log updates
- Evidence: `renderer/routes/PlanDetails/hooks/usePlanExecution.ts:18` updates state per action step.
- Improvement:
  - append in reducer + batched commits (or transition updates) for smoother UI.

## Suggested Execution Order

1. Stabilize reliability: items 1, 2, 3, 7.
2. Improve large-plan performance: items 4, 5, 6.
3. Eliminate correctness drift: items 8, 9, 10, 11.
4. Raise type safety baseline: items 12, 13, 14.
5. Do speed extras: route splitting, virtualization, batched logs.

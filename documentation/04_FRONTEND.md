# 04_FRONTEND

> ⚠ HUMAN REVIEW REQUIRED
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-20
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Technology Stack (from FACT_DEPENDENCIES.md)

| Package | Version | Purpose (if explicit) |
|---------|---------|----------------------|
| react | ^19.2.0 | UI Framework |
| react-dom | ^19.2.0 | DOM Rendering |
| react-router-dom | ^7.12.0 | Routing |
| zustand | ^5.0.10 | State Management |
| @hello-pangea/dnd | ^16.5.0 | Drag and Drop |
| @radix-ui/react-dialog | ^1.1.15 | Dialog Component |
| @radix-ui/react-dropdown-menu | ^2.1.16 | Dropdown Menu |
| @radix-ui/react-scroll-area | ^1.2.10 | Scroll Area |
| @radix-ui/react-slot | ^1.2.4 | Slot Component |
| lucide-react | ^0.554.0 | Icons |
| framer-motion | ^12.26.2 | Animations |
| tailwindcss | ^3.4.17 | CSS Framework |
| vite | ^7.2.2 | Build Tool |

---

## 2. File Structure (Verified)

```
renderer/
├── app/
│   └── main.jsx            # React entry point
├── components/
│   ├── BackendStatus.jsx
│   ├── JsonViewer.jsx
│   ├── PlanModal.jsx
│   ├── TestTree.jsx
│   ├── schema/             # 4 files
│   ├── tree/               # 2 files
│   └── ui/                 # 8 files
├── core/
│   ├── adapters/           # 2 files
│   ├── api/                # 1 file
│   ├── ipc/                # 1 file
│   ├── registries/         # 1 file
│   ├── schemas/            # 1 file (action-schemas.json)
│   └── services/           # 1 file
├── layouts/                # 1 file
├── routes/
│   ├── Dashboard/          # 2 files
│   ├── PlanDetails/        # 2 files
│   └── Settings/           # 1 file
├── stores/
│   ├── usePlanCacheStore.js
│   └── useUiStore.js
└── globals.css
```

**Source**: File system listing

---

## 3. State Stores (Zustand)

**Library**: `zustand` ^5.0.10

### useUiStore (`renderer/stores/useUiStore.js`)

UI state management for layout controls.

```javascript
export const useUiStore = create((set) => ({
  isSidebarOpen: true,
  toggleSidebar: () => set((state) => ({ isSidebarOpen: !state.isSidebarOpen })),
}))
```

| Property | Type | Purpose |
|----------|------|---------|
| `isSidebarOpen` | boolean | Controls sidebar visibility |
| `toggleSidebar()` | function | Toggles sidebar state |

### usePlanCacheStore (`renderer/stores/usePlanCacheStore.js`)

Caches loaded test plans in memory.

```javascript
export const usePlanCacheStore = create((set) => ({
  plans: [],
  setPlans: (plans) => set({ plans }),
  clearPlans: () => set({ plans: [] })
}))
```

| Property | Type | Purpose |
|----------|------|---------|
| `plans` | array | Cached test plan objects |
| `setPlans(plans)` | function | Replace all cached plans |
| `clearPlans()` | function | Clear plan cache |

---

## 4. Action Executor (`renderer/core/services/ActionExecutor.js`)

Core service that executes test actions. Handles both client-side and server-side actions.

### Execution Flow

```
ActionExecutor.execute(action)
    │
    ├── Client-Side Action? → executeClientSide()
    │       ├── Wait → setTimeout
    │       ├── LogMessage → console.log
    │       ├── SetVariable → (future: context store)
    │       └── Custom → (mock execution)
    │
    └── Server-Side Action? → executeServerSide()
            └── apiClient.post(endpoint, params)
```

### Client-Side Actions (Lines 62-83)

| Action Type | Behavior |
|-------------|----------|
| `Wait` | `await setTimeout(duration)` |
| `LogMessage` | `console.log(level, message)` |
| `SetVariable` | Logs variable (future: context store) |
| `Custom` | Mock execution (not fully implemented) |

### Server-Side Actions (Lines 41-58)

```javascript
if (plugin.apiMethod === 'GET') {
  data = await apiClient.get(plugin.apiEndpoint)
} else {
  data = await apiClient.post(plugin.apiEndpoint, action.params || {})
}
```

**Response Normalization**: Converts PascalCase (`Success`) to camelCase (`success`).

---

## 4. Entry Script (from FACT_ENTRY_POINTS.md)

| Setting | Value |
|---------|-------|
| Entry File | /renderer/app/main.jsx |
| Root Element | document.getElementById('root') |
| CSS Import | ../globals.css |
| React Mode | NOT in StrictMode (no wrapper observed) |
| Dark Mode | Forced via `document.documentElement.classList.add('dark')` |

**Source**: main.jsx Lines 7, 12

---

## 5. IPC API (from FACT_ENTRY_POINTS.md)

Frontend can invoke these channels via `window.electronAPI`:

| Channel | Purpose |
|---------|---------|
| dialog:pickFolder | Open folder picker dialog |
| fs:readFile | Read file contents |
| fs:writeFile | Write JSON to file |
| fs:listJsonFiles | List JSON files in folder |
| fs:deleteFile | Delete a file |
| settings:read | Read user settings |
| settings:write | Write user settings |

---

## 6. Action Schema (from core/schemas/action-schemas.json)

The frontend uses a schema-driven approach for ARAS actions. Key observations:

| Category | Count |
|----------|-------|
| Connection & Authentication | 3 actions |
| Item CRUD Operations | 7 actions |
| Lock Operations | 3 actions |
| Lifecycle Operations | 2 actions |
| Relationship Operations | 3 actions |
| Workflow Operations | 3 actions |
| AML & SQL Execution | 3 actions |
| Assertion / Verification | 4+ actions |

**Source**: FACT_PUBLIC_INTERFACES.md (backend API mappings correspond to schema actions)

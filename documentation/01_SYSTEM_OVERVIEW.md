# 01_SYSTEM_OVERVIEW

> ⚠ HUMAN REVIEW REQUIRED
> - Business logic interpretation
> - Security implications
> - Architectural intent

**Code Snapshot**: 2026-01-20
**Drift Warning**: This documentation reflects the codebase state at the above snapshot and may become outdated.

---

## 1. Purpose (Verbatim from README)

> "Manual testing of ARAS PLM configurations is tedious, repetitive, and prone to human error. **ARASTester** changes the game."
>
> "Designed specifically for **ARAS PLM Testers** and **Configuration Developers**, this tool empowers you to build, organize, and execute complex test scenarios without writing a single line of code."

**Source**: [README.md](file:///c:/Projects/ARASTester/README.md), Lines 22-25

---

## 2. Purpose (from `package.json`)

> "This is a application for automatic testing of ARAS"

**Source**: [package.json](file:///c:/Projects/ARASTester/package.json), Line 4

---

## 3. Key Features (Verbatim from README)

| Feature | Description | Source Line |
|---------|-------------|-------------|
| Visual Test Builder | Drag-and-drop interface for test plans | 29-30 |
| Hierarchical Organization | Nested test tree structure | 32-33 |
| Native Performance | Electron + React desktop experience | 35-36 |
| Privacy First | Local JSON file storage, no cloud | 38-39 |
| Extensible Action Registry | Pre-loaded ARAS interactions | 41-42 |

---

## 4. Target Users (Verbatim from README)

- **QA Teams**: Reduce regression testing time from days to minutes.
- **Developers**: Verify configuration changes instantly.

**Source**: [README.md](file:///c:/Projects/ARASTester/README.md), Lines 46-47

---

## 5. Application Metadata (from `package.json`)

| Field | Value |
|-------|-------|
| Name | arastester |
| Version | 1.0.0 |
| Author | Gopale Ashwin |
| License | ISC |
| Platform | win-x64 (from csproj RuntimeIdentifier) |

**Source**: [package.json](file:///c:/Projects/ARASTester/package.json), Lines 2-6

---

## 6. Technology Stack Claims in README

| Category | Technologies Listed | Verified |
|----------|---------------------|----------|
| Frontend | React, Vite, Tailwind CSS, Radix UI | ✅ Present in FACT_DEPENDENCIES.md |
| Backend | Electron, Node.js | ⚠ README states "Backend: Electron, Node.js" but actual backend is ASP.NET Core |
| State Management | Local JSON Storage | ✅ Verified in main.js IPC handlers |

> ⚠ **DISCREPANCY NOTED**: README Line 73 states "Backend: Electron, Node.js" but the actual backend is ASP.NET Core with Aras.IOM SDK (see FACT_DEPENDENCIES.md).

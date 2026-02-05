# Enforcement Debt & Guardrails

## Overview

This project currently carries "Enforcement Debt" in the form of relaxed ESLint rules and pending warnings. These are not "hotfixes" but rather a pragmatic decision to stabilize the build without rewriting legacy code immediately.

## Current Debt Status

As of **February 2026**:

- **ESLint Warnings**: ~109
- **Strict Rules Downgraded**:
  - `@typescript-eslint/no-explicit-any` (warn)
  - `@typescript-eslint/no-floating-promises` (warn)
  - `@typescript-eslint/no-unsafe-*` family (warn)

## Governance Policy

### 1. Zero-Growth Rule

**The number of warnings MUST NOT increase.**
We enforce this via CI checks that cap the allowed warnings at the current baseline (109).

### 2. Resolution Strategy

- **Boy Scout Rule**: If you touch a file with warnings, fix them.
- **Dedicated Cleanup**: Address one rule category at a time in separate PRs (e.g., "Fix all `no-explicit-any` in `renderer`").

### 3. CI Enforcement

The `npm run ci:lint` script runs with `--max-warnings 109`.

- If you introduce a _new_ warning, the build will FAIL.
- If you _fix_ a warning, you must lower the threshold in `package.json` to lock in the improvement.

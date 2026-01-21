# Palette's Journal

## 2026-01-21 - Icon-Only Button Accessibility
**Learning:** The application relies heavily on icon-only buttons (Trash, Plus, Chevron) and custom div-based toggles without native semantic roles or labels. This makes the tree view difficult for screen reader users.
**Action:** Consistently apply `aria-label` to all icon-only buttons and consider replacing custom div toggles with native inputs or proper ARIA roles in future refactors.

// renderer/core/index.js
// Barrel export for core architectural modules

export { actionRegistry } from './registries/ActionRegistry'
export { default as TestPlanAdapter } from './adapters/TestPlanAdapter'
export { default as StorageService } from './adapters/StorageService'
export { getTestPlansFldrPath, setTestPlansFldrPath } from './ipc/appSettings'

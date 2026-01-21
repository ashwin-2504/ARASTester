// renderer/core/index.ts
// Barrel export for core architectural modules

export { actionRegistry } from './registries/ActionRegistry'
export * as TestPlanAdapter from './adapters/TestPlanAdapter'
export * as StorageService from './adapters/StorageService'
export { getTestPlansFldrPath, setTestPlansFldrPath } from './ipc/appSettings'

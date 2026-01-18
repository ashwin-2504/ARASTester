// renderer/core/index.js
// Barrel export for core architectural modules

export { actionRegistry } from './registries/ActionRegistry'
import * as TestPlanAdapter from './adapters/TestPlanAdapter'
export { TestPlanAdapter }
import * as StorageService from './adapters/StorageService'
export { StorageService }
export { getTestPlansFldrPath, setTestPlansFldrPath } from './ipc/appSettings'

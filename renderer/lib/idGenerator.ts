/**
 * Utility functions for generating unique identifiers for tests and actions.
 */

/**
 * Generates a short unique ID for a Test.
 */
export function generateTestId(): string {
  return `test_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
}

/**
 * Generates a short unique ID for an Action.
 */
export function generateActionId(): string {
  return `act_${Math.random().toString(36).substring(2, 9)}_${Date.now().toString(36)}`
}

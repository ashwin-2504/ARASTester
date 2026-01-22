import { apiClient } from "@/core/api/client";
import { actionRegistry } from "@/core/registries/ActionRegistry";
import { useSessionStore } from "@/stores/useSessionStore";
import type { Action, ActionPlugin } from "@/types/plan";

export interface ActionResult {
  success: boolean;
  message?: string;
  [key: string]: any;
}

/**
 * Service to execute actions (both client-side and server-side)
 */
export const ActionExecutor = {
  /**
   * Execute a single action
   * @param action - The action object from the test plan
   * @returns Result object { success: boolean, ...details }
   */
  async execute(action: Action, sessionName?: string): Promise<ActionResult> {
    try {
      const plugin = actionRegistry.get(action.actionType);

      // 1. Handle Client-Side Actions
      if (plugin?.isClientSide) {
        return await this.executeClientSide(action, plugin);
      }

      // 2. Handle Server-Side Actions via API
      if (plugin?.apiEndpoint) {
        return await this.executeServerSide(action, plugin, sessionName);
      }

      // 3. Fallback for unknown types
      return {
        success: false,
        message: `No handler for action type: ${action.actionType}`,
      };
    } catch (err: any) {
      console.error("Action Execution Error:", err);
      return {
        success: false,
        message: err.message || "Unknown execution error",
      };
    }
  },

  async executeServerSide(action: Action, plugin: ActionPlugin, sessionName?: string): Promise<ActionResult> {
    try {
      let data: any;
      
      // Resolve session name: explicit -> store current -> undefined (default)
      const resolvedSessionName = sessionName || useSessionStore.getState().currentSessionName;
      const options = resolvedSessionName ? { sessionName: resolvedSessionName } : {};
      
      if (plugin.apiMethod === "GET") {
        data = await apiClient.get(plugin.apiEndpoint!, options);
      } else {
        data = await apiClient.post(plugin.apiEndpoint!, action.params || {}, options);
      }
      
      // Response is already normalized by apiClient
      return {
        success: data.success ?? true,
        ...data,
      };
    } catch (err: any) {
      // Handle AbortError gracefully
      if (err.name === "AbortError") {
        return { success: false, message: "Request was cancelled" };
      }
      throw err;
    }
  },

  async executeClientSide(action: Action, _plugin: ActionPlugin): Promise<ActionResult> {
    switch (action.actionType) {
      case "Wait": {
        const duration = Number(action.params?.duration) || 1000;
        await new Promise((r) => setTimeout(r, duration));
        return { success: true, message: `Waited ${duration}ms` };
      }

      case "LogMessage":
        console.log(
          `[${action.params?.level || "info"}]`,
          action.params?.message,
        );
        return { success: true, message: action.params?.message };

      case "SetVariable":
        // Future: Context variable store integration
        console.log(
          `Set variable: ${action.params?.variableName} = ${action.params?.value}`,
        );
        return {
          success: true,
          variableName: action.params?.variableName,
          value: action.params?.value,
        };

      default:
        return { success: true, message: "Client-side action completed" };
    }
  },
};

import { apiClient } from "@/core/api/client";
import { actionRegistry } from "@/core/registries/ActionRegistry";

/**
 * Service to execute actions (both client-side and server-side)
 */
export const ActionExecutor = {
  /**
   * Execute a single action
   * @param {Object} action - The action object from the test plan
   * @returns {Promise<Object>} - Result object { success: boolean, ...details }
   */
  async execute(action) {
    try {
      const plugin = actionRegistry.get(action.actionType);

      // 1. Handle Client-Side Actions
      if (plugin?.isClientSide) {
        return await this.executeClientSide(action, plugin);
      }

      // 2. Handle Server-Side Actions via API
      if (plugin?.apiEndpoint) {
        return await this.executeServerSide(action, plugin);
      }

      // 3. Fallback for unknown types
      return {
        success: false,
        message: `No handler for action type: ${action.actionType}`,
      };
    } catch (err) {
      console.error("Action Execution Error:", err);
      return {
        success: false,
        message: err.message || "Unknown execution error",
      };
    }
  },

  async executeServerSide(action, plugin) {
    try {
      let data;
      if (plugin.apiMethod === "GET") {
        data = await apiClient.get(plugin.apiEndpoint);
      } else {
        data = await apiClient.post(plugin.apiEndpoint, action.params || {});
      }
      // Response is already normalized by apiClient
      return {
        success: data.success ?? true,
        ...data,
      };
    } catch (err) {
      // Handle AbortError gracefully
      if (err.name === "AbortError") {
        return { success: false, message: "Request was cancelled" };
      }
      throw err;
    }
  },

  async executeClientSide(action, plugin) {
    switch (action.actionType) {
      case "Wait":
        const duration = action.params?.duration || 1000;
        await new Promise((r) => setTimeout(r, duration));
        return { success: true, message: `Waited ${duration}ms` };

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

      case "Custom":
        console.log(
          "Custom script execution not fully implemented:",
          action.params?.code,
        );
        return { success: true, message: "Custom script executed (mock)" };

      default:
        return { success: true, message: "Client-side action completed" };
    }
  },
};

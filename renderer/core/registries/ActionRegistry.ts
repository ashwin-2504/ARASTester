import React from "react";
import actionSchemas from "@/core/schemas/action-schemas.json";
import { SchemaFormRenderer } from "@/components/schema";
import type { ActionPlugin, ActionSchema, ActionSchemaField } from "@/types/plan";

/**
 * ActionRegistry - Schema-driven action plugin system
 *
 * Loads action definitions from action-schemas.json and provides:
 * - Dynamic Editor components via SchemaFormRenderer
 * - Default parameters from schema
 * - API endpoint information for execution
 * - Category and metadata for UI organization
 */
class ActionRegistry {
  private plugins: Map<string, ActionPlugin>;
  private categories: Map<string, unknown>;

  constructor() {
    this.plugins = new Map();
    this.categories = new Map();
    this.loadFromSchema();
  }

  /**
   * Load all actions from the schema file
   */
  loadFromSchema() {
    // Load categories
    if (actionSchemas.categories) {
      actionSchemas.categories.forEach((cat: unknown) => {
        // We know cat has an id because we use it, but safe practice is to inspect or assert if needed.
        // For now, we store as unknown or type assert if we trust schema.json structure "mostly".
        // Let's use a basic shape check if we were strict, but here we just store it.
        // Actually cat needs to be an object with an ID to be useful in the map.
         const category = cat as { id: string, [key: string]: unknown };
         if (category && category.id) {
            this.categories.set(category.id, category);
         }
      });
    }

    // Load actions
    if (actionSchemas.actions) {
      actionSchemas.actions.forEach((schema: unknown) => {
        // Assert schema is ActionSchema to proceed, trusting the JSON loader for now but avoiding 'any'
        this.register(this.createPluginFromSchema(schema as ActionSchema));
      });
    }
  }

  /**
   * Create a plugin object from a schema definition
   */
  createPluginFromSchema(schema: ActionSchema): ActionPlugin {
    return {
      type: schema.type,
      label: schema.label,
      category: schema.category,
      description: schema.description,
      apiEndpoint: schema.apiEndpoint,
      apiMethod: schema.apiMethod || "POST",
      isClientSide: schema.isClientSide || false,
      defaultParams: this.buildDefaultParams(schema.fields),
      // Create a dynamic Editor component that uses SchemaFormRenderer
      // Props typed as any in signature previously -> unknown or defined interface
      // Editor props usually: { params: Record<string, any>, onChange: (newParams) => void }
      Editor: (props: { params?: Record<string, unknown>, onChange?: (p: Record<string, unknown>) => void }) =>
        React.createElement(SchemaFormRenderer, {
          schema: schema,
          params: props.params as Record<string, any>,
          onChange: props.onChange as any,
        }),
      schema: schema, // Keep reference for validation and other uses
    };
  }

  /**
   * Build default parameters object from field definitions
   */
  buildDefaultParams(fields: ActionSchemaField[]): Record<string, unknown> {
    if (!fields || fields.length === 0) return {};

    return fields.reduce((acc: Record<string, unknown>, field) => {
      if (field.default !== undefined) {
        acc[field.name] = field.default;
      }
      return acc;
    }, {});
  }

  /**
   * Register a plugin (used for custom/manual plugins)
   */
  register(plugin: ActionPlugin) {
    if (!plugin.type) {
      console.error("Invalid plugin registration - missing type:", plugin);
      return;
    }
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Get a plugin by type
   */
  get(type: string): ActionPlugin | undefined {
    return this.plugins.get(type);
  }

  /**
   * Get all registered plugins
   */
  getAll(): ActionPlugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins grouped by category
   */
  getByCategory() {
    const grouped = new Map();

    this.plugins.forEach((plugin) => {
      const categoryId = plugin.category || "other";
      if (!grouped.has(categoryId)) {
        const categoryInfo = this.categories.get(categoryId) || {
          id: categoryId,
          label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          icon: "📋",
        };
        grouped.set(categoryId, {
          ...categoryInfo,
          actions: [],
        });
      }
      grouped.get(categoryId).actions.push(plugin);
    });

    return grouped;
  }
}

export const actionRegistry = new ActionRegistry();

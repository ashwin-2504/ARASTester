import React from 'react';
import actionSchemas from '@/core/schemas/action-schemas.json';
import { SchemaFormRenderer } from '@/components/schema';

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
      actionSchemas.categories.forEach(cat => {
        this.categories.set(cat.id, cat);
      });
    }

    // Load actions
    if (actionSchemas.actions) {
      actionSchemas.actions.forEach(schema => {
        this.register(this.createPluginFromSchema(schema));
      });
    }
  }

  /**
   * Create a plugin object from a schema definition
   */
  createPluginFromSchema(schema) {
    return {
      type: schema.type,
      label: schema.label,
      category: schema.category,
      description: schema.description,
      apiEndpoint: schema.apiEndpoint,
      apiMethod: schema.apiMethod || 'POST',
      isClientSide: schema.isClientSide || false,
      defaultParams: this.buildDefaultParams(schema.fields),
      // Create a dynamic Editor component that uses SchemaFormRenderer
      Editor: (props) => React.createElement(SchemaFormRenderer, {
        schema: schema,
        params: props.params,
        onChange: props.onChange
      }),
      schema: schema // Keep reference for validation and other uses
    };
  }

  /**
   * Build default parameters object from field definitions
   */
  buildDefaultParams(fields) {
    if (!fields || fields.length === 0) return {};

    return fields.reduce((acc, field) => {
      if (field.default !== undefined) {
        acc[field.name] = field.default;
      }
      return acc;
    }, {});
  }

  /**
   * Register a plugin (used for custom/manual plugins)
   */
  register(plugin) {
    if (!plugin.type) {
      console.error("Invalid plugin registration - missing type:", plugin);
      return;
    }
    this.plugins.set(plugin.type, plugin);
  }

  /**
   * Get a plugin by type
   */
  get(type) {
    return this.plugins.get(type);
  }

  /**
   * Get all registered plugins
   */
  getAll() {
    return Array.from(this.plugins.values());
  }

  /**
   * Get plugins grouped by category
   */
  getByCategory() {
    const grouped = new Map();

    this.plugins.forEach(plugin => {
      const categoryId = plugin.category || 'other';
      if (!grouped.has(categoryId)) {
        const categoryInfo = this.categories.get(categoryId) || {
          id: categoryId,
          label: categoryId.charAt(0).toUpperCase() + categoryId.slice(1),
          icon: '📋'
        };
        grouped.set(categoryId, {
          ...categoryInfo,
          actions: []
        });
      }
      grouped.get(categoryId).actions.push(plugin);
    });

    return grouped;
  }

  /**
   * Get category info
   */
  getCategory(categoryId) {
    return this.categories.get(categoryId);
  }

  /**
   * Get all categories
   */
  getAllCategories() {
    return Array.from(this.categories.values());
  }

  /**
   * Get schema version
   */
  getVersion() {
    return actionSchemas.version || '1.0.0';
  }
}

export const actionRegistry = new ActionRegistry();

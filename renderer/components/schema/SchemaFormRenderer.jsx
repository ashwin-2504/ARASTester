import React from 'react';
import FieldRenderer from './FieldRenderer';

/**
 * SchemaFormRenderer - Renders an entire action form from its schema definition.
 * 
 * This component takes an action schema and renders all its fields dynamically,
 * eliminating the need for per-action Editor components.
 * 
 * @param {Object} schema - The action schema from action-schemas.json
 * @param {Object} params - Current parameter values
 * @param {Function} onChange - Callback when any parameter changes
 */
const SchemaFormRenderer = ({ schema, params = {}, onChange }) => {
  if (!schema || !schema.fields) {
    return (
      <div className="p-4 text-muted-foreground text-center">
        No configuration required for this action.
      </div>
    );
  }

  // Handle empty fields array
  if (schema.fields.length === 0) {
    return (
      <div className="p-4 bg-muted/20 rounded-lg text-center">
        <p className="text-sm text-muted-foreground">
          This action has no configurable parameters.
        </p>
        {schema.description && (
          <p className="text-xs text-muted-foreground mt-2 italic">
            {schema.description}
          </p>
        )}
      </div>
    );
  }

  const handleFieldChange = (fieldName, value) => {
    onChange({
      ...params,
      [fieldName]: value
    });
  };

  // Group fields for better layout (2 columns for simple fields)
  const simpleFields = schema.fields.filter(f =>
    ['text', 'number', 'password', 'select', 'checkbox'].includes(f.type)
  );
  const complexFields = schema.fields.filter(f =>
    ['textarea', 'keyvalue', 'json'].includes(f.type)
  );

  return (
    <div className="space-y-5">
      {/* Simple fields - can be 2 columns if there are many */}
      {simpleFields.length > 0 && (
        <div className={simpleFields.length > 2 ? "grid grid-cols-1 md:grid-cols-2 gap-4" : "space-y-4"}>
          {simpleFields.map(field => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={params[field.name]}
              onChange={(value) => handleFieldChange(field.name, value)}
            />
          ))}
        </div>
      )}

      {/* Complex fields - always full width */}
      {complexFields.length > 0 && (
        <div className="space-y-4">
          {complexFields.map(field => (
            <FieldRenderer
              key={field.name}
              field={field}
              value={params[field.name]}
              onChange={(value) => handleFieldChange(field.name, value)}
            />
          ))}
        </div>
      )}

      {/* Description note */}
      {schema.description && (
        <div className="p-3 bg-muted/50 rounded-md text-xs text-muted-foreground">
          <strong>Note:</strong> {schema.description}
        </div>
      )}
    </div>
  );
};

export default SchemaFormRenderer;
export { SchemaFormRenderer };

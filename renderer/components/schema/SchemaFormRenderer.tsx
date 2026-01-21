import React, { useMemo } from 'react';
import FieldRenderer from './FieldRenderer';
import type { ActionSchema } from '@/types/plan';

interface SchemaFormRendererProps {
  schema: ActionSchema;
  params: Record<string, any>;
  onChange: (params: Record<string, any>) => void;
  showValidation?: boolean;
}

/**
 * SchemaFormRenderer - Renders an entire action form from its schema definition.
 * 
 * This component takes an action schema and renders all its fields dynamically,
 * eliminating the need for per-action Editor components.
 */
const SchemaFormRenderer: React.FC<SchemaFormRendererProps> = ({ schema, params = {}, onChange, showValidation = false }) => {
  // Calculate validation errors for required fields
  const validationErrors = useMemo<Record<string, string>>(() => {
    if (!schema?.fields) return {};

    const errors: Record<string, string> = {};
    schema.fields.forEach(field => {
      if (field.required) {
        const value = params[field.name];
        const isEmpty = value === undefined || value === null || value === '';
        if (isEmpty) {
          errors[field.name] = `${field.label || field.name} is required`;
        }
      }
    });
    return errors;
  }, [schema?.fields, params, schema]);



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

  const handleFieldChange = (fieldName: string, value: any) => {
    const newParams = {
      ...params,
      [fieldName]: value
    };

    onChange(newParams);
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
          {simpleFields.map((field, index) => (
            <FieldRenderer
              key={field.name || `simple-${index}`}
              field={field}
              value={params[field.name]}
              onChange={(value: any) => handleFieldChange(field.name, value)}
              error={showValidation ? validationErrors[field.name] : undefined}
            />
          ))}
        </div>
      )}

      {/* Complex fields - always full width */}
      {complexFields.length > 0 && (
        <div className="space-y-4">
          {complexFields.map((field, index) => (
            <FieldRenderer
              key={field.name || `complex-${index}`}
              field={field}
              value={params[field.name]}
              onChange={(value: any) => handleFieldChange(field.name, value)}
              error={showValidation ? validationErrors[field.name] : undefined}
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

import React from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';
import KeyValueEditor from './KeyValueEditor';

/**
 * Renders a single form field based on its schema definition.
 * Supports: text, number, password, textarea, select, checkbox, keyvalue, json
 */
const FieldRenderer = ({ field, value, onChange }) => {
  const handleChange = (newValue) => {
    onChange(newValue);
  };

  const baseInputClass = "bg-muted/30";

  // Render help text if present
  const renderHelpText = () => {
    if (!field.helpText) return null;
    return (
      <p className="text-xs text-muted-foreground mt-1">
        {field.helpText}
      </p>
    );
  };

  // Render required indicator
  const renderLabel = () => (
    <label className="text-sm font-medium leading-none block mb-2">
      {field.label}
      {field.required && <span className="text-red-500 ml-1">*</span>}
    </label>
  );

  switch (field.type) {
    case 'text':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {renderHelpText()}
        </div>
      );

    case 'number':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            type="number"
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value ? parseInt(e.target.value, 10) : '')}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {renderHelpText()}
        </div>
      );

    case 'password':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            type="password"
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder || '••••••••'}
            className={baseInputClass}
          />
          {renderHelpText()}
        </div>
      );

    case 'textarea':
      return (
        <div className="space-y-1">
          {renderLabel()}
          {field.prefix && <div className="text-xs font-mono text-muted-foreground font-bold">{field.prefix}</div>}
          <textarea
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary ${baseInputClass}`}
          />
          {field.suffix && <div className="text-xs font-mono text-muted-foreground font-bold">{field.suffix}</div>}
          {renderHelpText()}
        </div>
      );

    case 'select':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <select
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            className={`w-full appearance-none rounded-md border border-input px-4 py-2.5 text-sm focus:border-primary focus:ring-primary ${baseInputClass}`}
          >
            {field.options?.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {renderHelpText()}
        </div>
      );

    case 'checkbox':
      return (
        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={value ?? field.default ?? false}
            onChange={(e) => handleChange(e.target.checked)}
            className="rounded border-border text-primary focus:ring-primary h-4 w-4"
          />
          <label className="text-sm font-medium">{field.label}</label>
          {field.helpText && (
            <span className="text-xs text-muted-foreground ml-2">
              ({field.helpText})
            </span>
          )}
        </div>
      );

    case 'keyvalue':
      return (
        <KeyValueEditor
          field={field}
          value={value}
          onChange={handleChange}
        />
      );

    case 'json':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <textarea
            value={typeof value === 'object' ? JSON.stringify(value, null, 2) : (value ?? '')}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleChange(parsed);
              } catch {
                // Keep as string if invalid JSON
                handleChange(e.target.value);
              }
            }}
            placeholder={field.placeholder || '{\n  "key": "value"\n}'}
            className={`w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary ${baseInputClass}`}
          />
          {renderHelpText()}
        </div>
      );

    default:
      // Default to text input
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {renderHelpText()}
        </div>
      );
  }
};

export default FieldRenderer;


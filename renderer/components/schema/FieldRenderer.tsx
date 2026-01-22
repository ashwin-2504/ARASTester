import React, { useState, useEffect, useRef } from 'react';
import { Input } from '@/components/ui/input.jsx';
// @ts-ignore
import KeyValueEditor from './KeyValueEditor';
import type { ActionSchemaField } from '@/types/plan';

interface FieldRendererProps {
  field: ActionSchemaField;
  value: any;
  onChange: (value: any) => void;
  error?: string;
}

// Helper hook for debounced value
function useDebouncedChange(value: any, onChange: (val: any) => void, delay = 300) {
  const [localValue, setLocalValue] = useState(value);
  const skipUpdate = useRef(false);

  // Sync local value when prop value changes (e.g. undo/redo or selection change)
  useEffect(() => {
    if (!skipUpdate.current) {
      setLocalValue(value);
    }
    skipUpdate.current = false;
  }, [value]);

  useEffect(() => {
    const timer = setTimeout(() => {
      // Only call onChange if the value is different (avoid initial fire)
      if (localValue !== value) {
        skipUpdate.current = true; // Flag to ignore the incoming prop update triggered by this change
        onChange(localValue);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [localValue, delay]); // Don't include onChange/value in deps to avoid loops, logic handled inside

  return [localValue, setLocalValue] as const;
}

/**
 * Renders a single form field based on its schema definition.
 * Supports: text, number, password, textarea, select, checkbox, keyvalue, json
 */
const FieldRenderer: React.FC<FieldRendererProps> = ({ field, value, onChange, error }) => {
  // We use local state for inputs that trigger frequent updates (text, number, textarea, json)
  // Checkbox and Select are usually instant/cheap enough, but text needs debouncing.
  
  const [textValue, setTextValue] = useDebouncedChange(value ?? field.default ?? '', onChange);
  const [numberValue, setNumberValue] = useDebouncedChange(value ?? field.default ?? '', onChange);
  const [jsonValue, setJsonValue] = useDebouncedChange(
     typeof value === 'object' ? JSON.stringify(value, null, 2) : (value ?? ''),
     (val: string) => {
        try {
            const parsed = JSON.parse(val);
            onChange(parsed);
        } catch {
            onChange(val);
        }
     }
  );

  const baseInputClass = "bg-muted/30";
  const errorInputClass = error ? "border-red-500 focus:border-red-500 focus:ring-red-500" : "";

  // Render help text or error
  const renderHelpText = () => {
    if (error) {
      return (
        <p className="text-xs text-red-500 mt-1">
          {error}
        </p>
      );
    }
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
    case 'password':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            type={field.type}
            value={textValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value)}
            placeholder={field.placeholder || (field.type === 'password' ? '••••••••' : undefined)}
            className={`${baseInputClass} ${errorInputClass}`}
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
            value={numberValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNumberValue(e.target.value)}
            placeholder={field.placeholder}
            className={`${baseInputClass} ${errorInputClass}`}
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
            value={textValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setTextValue(e.target.value)}
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
            onChange={(e: React.ChangeEvent<HTMLSelectElement>) => onChange(e.target.value)}
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
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => onChange(e.target.checked)}
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
          onChange={onChange}
        />
      );

    case 'json':
      return (
        <div className="space-y-1">
          {renderLabel()}
          <textarea
            value={jsonValue}
            onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setJsonValue(e.target.value)}
            placeholder={field.placeholder || '{\n  "key": "value"\n}'}
            className={`w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary ${baseInputClass}`}
          />
          {renderHelpText()}
        </div>
      );

    default:
      // Default to text input logic
      return (
        <div className="space-y-1">
          {renderLabel()}
          <Input
            value={textValue}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setTextValue(e.target.value)}
            placeholder={field.placeholder}
            className={baseInputClass}
          />
          {renderHelpText()}
        </div>
      );
  }
};

export default FieldRenderer;

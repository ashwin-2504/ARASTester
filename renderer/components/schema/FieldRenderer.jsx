import React from 'react';
import { Input } from '@/components/ui/input';
import { Plus, Trash2 } from 'lucide-react';

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
          <textarea
            value={value ?? field.default ?? ''}
            onChange={(e) => handleChange(e.target.value)}
            placeholder={field.placeholder}
            className={`w-full min-h-[120px] rounded-md border border-input px-3 py-2 text-sm font-mono focus:border-primary focus:ring-1 focus:ring-primary ${baseInputClass}`}
          />
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

/**
 * Key-Value pair editor for criteria and properties fields
 */
const KeyValueEditor = ({ field, value, onChange }) => {
  // Convert object to array of pairs for editing
  const pairs = React.useMemo(() => {
    if (!value || typeof value !== 'object') return [{ key: '', value: '' }];
    const entries = Object.entries(value);
    return entries.length > 0 ? entries.map(([k, v]) => ({ key: k, value: v })) : [{ key: '', value: '' }];
  }, [value]);

  const updatePairs = (newPairs) => {
    // Convert array back to object, filtering empty keys
    const obj = {};
    newPairs.forEach(pair => {
      if (pair.key.trim()) {
        obj[pair.key.trim()] = pair.value;
      }
    });
    onChange(Object.keys(obj).length > 0 ? obj : undefined);
  };

  const handlePairChange = (index, key, val) => {
    const newPairs = [...pairs];
    newPairs[index] = { key, value: val };
    updatePairs(newPairs);
  };

  const addPair = () => {
    updatePairs([...pairs, { key: '', value: '' }]);
  };

  const removePair = (index) => {
    if (pairs.length === 1) {
      // Clear the only pair instead of removing
      updatePairs([{ key: '', value: '' }]);
    } else {
      updatePairs(pairs.filter((_, i) => i !== index));
    }
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none block">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
        {pairs.map((pair, index) => (
          <div key={index} className="flex gap-2 items-center">
            <Input
              value={pair.key}
              onChange={(e) => handlePairChange(index, e.target.value, pair.value)}
              placeholder="Property name"
              className="flex-1 bg-background"
            />
            <span className="text-muted-foreground">=</span>
            <Input
              value={pair.value}
              onChange={(e) => handlePairChange(index, pair.key, e.target.value)}
              placeholder="Value"
              className="flex-1 bg-background"
            />
            <button
              type="button"
              onClick={() => removePair(index)}
              className="p-2 text-muted-foreground hover:text-red-500 hover:bg-red-500/10 rounded transition-colors"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          </div>
        ))}

        <button
          type="button"
          onClick={addPair}
          className="flex items-center gap-1 text-sm text-muted-foreground hover:text-primary transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add property
        </button>
      </div>

      {field.helpText && (
        <p className="text-xs text-muted-foreground">
          {field.helpText}
        </p>
      )}
    </div>
  );
};

export default FieldRenderer;

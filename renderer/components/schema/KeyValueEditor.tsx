import React, { useMemo } from 'react';
import { Input } from '@/components/ui/input.jsx';
import { Plus, Trash2 } from 'lucide-react';
import type { ActionSchemaField } from '@/types/plan';

interface KeyValueEditorProps {
  field: ActionSchemaField;
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string> | undefined) => void;
}

interface KeyValuePair {
  key: string;
  value: string;
}

/**
 * Key-Value pair editor for criteria and properties fields
 */
const KeyValueEditor: React.FC<KeyValueEditorProps> = ({ field, value, onChange }) => {
  // Convert object to array of pairs for editing
  const pairs = useMemo<KeyValuePair[]>(() => {
    if (!value || typeof value !== 'object') return [{ key: '', value: '' }];
    const entries = Object.entries(value);
    return entries.length > 0 ? entries.map(([k, v]) => ({ key: k, value: String(v) })) : [{ key: '', value: '' }];
  }, [value]);

  const updatePairs = (newPairs: KeyValuePair[]) => {
    // Convert array back to object, filtering empty keys
    const obj: Record<string, string> = {};
    newPairs.forEach(pair => {
      if (pair.key.trim()) {
        obj[pair.key.trim()] = pair.value;
      }
    });
    onChange(Object.keys(obj).length > 0 ? obj : undefined);
  };

  const handlePairChange = (index: number, key: string, val: string) => {
    const newPairs = [...pairs];
    newPairs[index] = { key, value: val };
    updatePairs(newPairs);
  };

  const addPair = () => {
    updatePairs([...pairs, { key: '', value: '' }]);
  };

  const removePair = (index: number) => {
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
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePairChange(index, e.target.value, pair.value)}
              placeholder="Property name"
              className="flex-1 bg-background"
            />
            <span className="text-muted-foreground">=</span>
            <Input
              value={pair.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => handlePairChange(index, pair.key, e.target.value)}
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

export default KeyValueEditor;

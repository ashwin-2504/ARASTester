import React, { useState, useEffect, useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import type { ActionSchemaField } from "@/types/plan";

interface KeyValueEditorProps {
  field: ActionSchemaField;
  value: Record<string, string> | undefined;
  onChange: (value: Record<string, string> | undefined) => void;
}

interface KeyValuePair {
  id: number; // Unique ID for stable React keys
  key: string;
  value: string;
}

let pairIdCounter = 0;
const generatePairId = () => ++pairIdCounter;

/**
 * Key-Value pair editor for criteria and properties fields.
 * Uses local state to preserve empty rows until they are filled in.
 */
const KeyValueEditor: React.FC<KeyValueEditorProps> = ({
  field,
  value,
  onChange,
}) => {
  // Local state for pairs - allows empty keys to exist in UI
  const [pairs, setPairs] = useState<KeyValuePair[]>(() => {
    if (
      !value ||
      typeof value !== "object" ||
      Object.keys(value).length === 0
    ) {
      return [{ id: generatePairId(), key: "", value: "" }];
    }
    return Object.entries(value).map(([k, v]) => ({
      id: generatePairId(),
      key: k,
      value: String(v),
    }));
  });

  // Sync from external value when it changes (e.g., undo/redo, external updates)
  useEffect(() => {
    if (
      !value ||
      typeof value !== "object" ||
      Object.keys(value).length === 0
    ) {
      // Only reset if we have no pairs or all pairs are empty
      const hasContent = pairs.some((p) => p.key.trim() || p.value.trim());
      if (!hasContent && pairs.length === 1) return; // Already have empty starter
      if (Object.keys(value || {}).length === 0 && !hasContent) return;
    }

    // Check if external value differs from our current pairs
    const currentObj: Record<string, string> = {};
    pairs.forEach((p) => {
      if (p.key.trim()) currentObj[p.key.trim()] = p.value;
    });

    const externalKeys = Object.keys(value || {}).sort();
    const currentKeys = Object.keys(currentObj).sort();

    if (JSON.stringify(externalKeys) !== JSON.stringify(currentKeys)) {
      // External value changed, sync it
      if (!value || Object.keys(value).length === 0) {
        setPairs([{ id: generatePairId(), key: "", value: "" }]);
      } else {
        setPairs(
          Object.entries(value).map(([k, v]) => ({
            id: generatePairId(),
            key: k,
            value: String(v),
          })),
        );
      }
    }
  }, [value]);

  // Propagate changes to parent (only non-empty keys)
  const propagateChanges = useCallback(
    (newPairs: KeyValuePair[]) => {
      const obj: Record<string, string> = {};
      newPairs.forEach((pair) => {
        if (pair.key.trim()) {
          obj[pair.key.trim()] = pair.value;
        }
      });
      onChange(Object.keys(obj).length > 0 ? obj : undefined);
    },
    [onChange],
  );

  const handlePairChange = (id: number, key: string, val: string) => {
    const newPairs = pairs.map((p) =>
      p.id === id ? { ...p, key, value: val } : p,
    );
    setPairs(newPairs);
    propagateChanges(newPairs);
  };

  const addPair = () => {
    const newPairs = [...pairs, { id: generatePairId(), key: "", value: "" }];
    setPairs(newPairs);
    // Don't propagate yet - empty pair won't affect parent
  };

  const removePair = (id: number) => {
    let newPairs: KeyValuePair[];
    if (pairs.length === 1) {
      // Clear the only pair instead of removing
      newPairs = [{ id: generatePairId(), key: "", value: "" }];
    } else {
      newPairs = pairs.filter((p) => p.id !== id);
    }
    setPairs(newPairs);
    propagateChanges(newPairs);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium leading-none block">
        {field.label}
        {field.required && <span className="text-red-500 ml-1">*</span>}
      </label>

      <div className="space-y-2 p-3 bg-muted/20 rounded-lg border border-border/50">
        {pairs.map((pair) => (
          <div key={pair.id} className="flex gap-2 items-center">
            <Input
              value={pair.key}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handlePairChange(pair.id, e.target.value, pair.value)
              }
              placeholder="Property name"
              className="flex-1 bg-background"
            />
            <span className="text-muted-foreground">=</span>
            <Input
              value={pair.value}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
                handlePairChange(pair.id, pair.key, e.target.value)
              }
              placeholder="Value"
              className="flex-1 bg-background"
            />
            <button
              type="button"
              onClick={() => removePair(pair.id)}
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
        <p className="text-xs text-muted-foreground">{field.helpText}</p>
      )}
    </div>
  );
};

export default KeyValueEditor;

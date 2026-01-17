import React from 'react';
import { Input } from '@/components/ui/input';

const CustomEditor = ({ params, onChange }) => {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium leading-none">Custom Command</label>
      <Input
        value={params.command || ''}
        onChange={(e) => onChange({ ...params, command: e.target.value })}
        placeholder="echo 'Hello'"
      />
      <p className="text-xs text-muted-foreground">
        Execute a custom script or command.
      </p>
    </div>
  );
};

export const CustomAction = {
  type: 'Custom',
  label: 'Custom Script',
  category: 'Utility',
  Editor: CustomEditor,
  defaultParams: { command: '' }
};

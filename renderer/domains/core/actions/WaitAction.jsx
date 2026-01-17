import React from 'react';
import { Input } from '@/components/ui/input';

const WaitEditor = ({ params, onChange }) => {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium leading-none">Duration (ms)</label>
      <Input
        type="number"
        value={params.duration || 1000}
        onChange={(e) => onChange({ ...params, duration: parseInt(e.target.value, 10) })}
      />
      <p className="text-xs text-muted-foreground">
        Pause execution for the specified duration in milliseconds.
      </p>
    </div>
  );
};

export const WaitAction = {
  type: 'Wait',
  label: 'Wait',
  category: 'Utility',
  Editor: WaitEditor,
  defaultParams: { duration: 1000 }
};

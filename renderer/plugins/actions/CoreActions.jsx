import React from 'react';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';

// --- Click Action ---
const ClickEditor = ({ params, onChange }) => {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium leading-none">Target Selector (CSS/XPath)</label>
      <Input
        value={params.selector || ''}
        onChange={(e) => onChange({ ...params, selector: e.target.value })}
        placeholder="#submit-btn"
      />
    </div>
  );
};

export const ClickAction = {
  type: 'Click',
  label: 'Click',
  Editor: ClickEditor,
  defaultParams: { selector: '' }
};

// --- Type Action ---
const TypeEditor = ({ params, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none">Target Selector</label>
        <Input
          value={params.selector || ''}
          onChange={(e) => onChange({ ...params, selector: e.target.value })}
          placeholder="#username"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none">Text to Type</label>
        <Input
          value={params.text || ''}
          onChange={(e) => onChange({ ...params, text: e.target.value })}
          placeholder="Hello World"
        />
      </div>
    </div>
  );
};

export const TypeAction = {
  type: 'Type',
  label: 'Type Text',
  Editor: TypeEditor,
  defaultParams: { selector: '', text: '' }
};

// --- Wait Action ---
const WaitEditor = ({ params, onChange }) => {
  return (
    <div className="grid gap-2">
      <label className="text-sm font-medium leading-none">Duration (ms)</label>
      <Input
        type="number"
        value={params.duration || 1000}
        onChange={(e) => onChange({ ...params, duration: parseInt(e.target.value, 10) })}
      />
    </div>
  );
};

export const WaitAction = {
  type: 'Wait',
  label: 'Wait',
  Editor: WaitEditor,
  defaultParams: { duration: 1000 }
};

// --- Verify Action ---
const VerifyEditor = ({ params, onChange }) => {
  return (
    <div className="space-y-4">
      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none">Target Selector</label>
        <Input
          value={params.selector || ''}
          onChange={(e) => onChange({ ...params, selector: e.target.value })}
          placeholder=".status-message"
        />
      </div>
      <div className="grid gap-2">
        <label className="text-sm font-medium leading-none">Expected Text</label>
        <Input
          value={params.expected || ''}
          onChange={(e) => onChange({ ...params, expected: e.target.value })}
          placeholder="Success"
        />
      </div>
    </div>
  );
};

export const VerifyAction = {
  type: 'Verify',
  label: 'Verify Text',
  Editor: VerifyEditor,
  defaultParams: { selector: '', expected: '' }
};

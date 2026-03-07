import React, { useState } from 'react'
import { Input } from '@/components/ui/input'

type InputProps = React.ComponentProps<typeof Input>;

interface BufferedInputProps extends Omit<InputProps, 'onChange'> {
  value: string;
  onChange?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export const BufferedInput = ({ value, onChange, ...props }: BufferedInputProps) => {
  const [localValue, setLocalValue] = useState(value);

  // Sync local value when external value changes (e.g. navigation)
  React.useEffect(() => {
    setLocalValue(value);
  }, [value]);

  return (
    <Input
      {...props}
      value={localValue}
      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setLocalValue(e.target.value)}
      onBlur={(e: React.FocusEvent<HTMLInputElement>) => {
        if (localValue !== value) {
          onChange?.({ ...e, target: { ...e.target, value: localValue } } as React.ChangeEvent<HTMLInputElement>);
        }
      }}
      onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
          e.currentTarget.blur();
        }
        props.onKeyDown?.(e);
      }}
    />
  );
};

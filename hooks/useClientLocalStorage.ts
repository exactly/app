import { useCallback, useEffect, useState } from 'react';

export default function useClientLocalStorage<T extends number | string | boolean>(key: string, def?: T) {
  const [value, setValue] = useState<T | undefined>();

  useEffect(() => {
    setValue((localStorage.getItem(key) as T) || def);
  }, [def, key]);

  const _setValue = useCallback(
    (_value: T) => {
      localStorage.setItem(key, _value as unknown as string);
      setValue(_value);
    },
    [key],
  );

  return [value, _setValue] as const;
}

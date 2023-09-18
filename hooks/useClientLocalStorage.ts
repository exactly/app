import { useCallback, useEffect, useState } from 'react';

export default function useClientLocalStorage<T extends number | string | boolean>(key: string, def?: T) {
  const [value, setValue] = useState<T | undefined>();

  useEffect(() => {
    const storedValue = localStorage.getItem(key);
    if (storedValue === null && def !== undefined) {
      setValue(def);
    } else if (storedValue !== null) {
      switch (typeof def) {
        case 'number':
          setValue(parseFloat(storedValue) as T);
          break;
        case 'boolean':
          setValue((storedValue === 'true') as T);
          break;
        default:
          setValue(storedValue as T);
          break;
      }
    }
  }, [def, key]);

  const _setValue = useCallback(
    (_value: T) => {
      let storageValue: string;

      switch (typeof _value) {
        case 'number':
          storageValue = String(_value);
          break;
        case 'boolean':
          storageValue = _value ? 'true' : 'false';
          break;
        default:
          storageValue = _value as string;
          break;
      }

      localStorage.setItem(key, storageValue);
      setValue(_value);
    },
    [key],
  );

  return [value, _setValue] as const;
}

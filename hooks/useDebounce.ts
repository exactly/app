import { useEffect, useState } from 'react';
import numbers from 'config/numbers.json';

function useDebounce<T>(value: T, delay?: number) {
  const [debouncedValue, setDebouncedValue] = useState<T | undefined>(undefined);

  useEffect(() => {
    const timer = setTimeout(() => setDebouncedValue(value), delay || numbers.debounceTime);

    return () => {
      clearTimeout(timer);
    };
  }, [value, delay]);

  return debouncedValue;
}

export default useDebounce;

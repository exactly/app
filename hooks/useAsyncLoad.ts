import { useCallback, useEffect, useRef, useState } from 'react';

export default function useAsyncLoad<T>(fn: () => Promise<T>) {
  const funcRef = useRef<typeof fn>(fn);
  const [data, setData] = useState<T>();
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    funcRef.current = fn;
  }, [fn]);

  const refetch = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      setData(await funcRef.current());
    } catch (e) {
      if (e instanceof Error) setError(e);
      setData(undefined);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    refetch();
  }, [refetch]);

  return { data, error, refetch, isLoading } as const;
}

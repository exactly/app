import { useEffect, useState } from 'react';

type Args = {
  effect: (cancelled: () => boolean) => Promise<void> | void;
  skip?: boolean;
  delay?: number;
};

export default function useDelayedEffect({ effect, skip = false, delay = 1000 }: Args) {
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (skip) return setIsLoading(false);

    setIsLoading(true);

    let cancel = false;
    const timeout = setTimeout(async () => {
      try {
        await effect(() => cancel);
      } catch {
        setIsLoading(false);
      } finally {
        setIsLoading(false);
      }
    }, delay);

    return () => {
      cancel = true;
      clearTimeout(timeout);
    };
  }, [skip, delay, effect]);

  return { isLoading };
}

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
    let done: ReturnType<typeof setTimeout> | undefined;
    const timeout = setTimeout(async () => {
      try {
        await effect(() => cancel);
      } finally {
        if (!cancel) done = setTimeout(() => setIsLoading(false), 250);
      }
    }, delay);

    return () => {
      cancel = true;
      clearTimeout(timeout);
      clearTimeout(done);
    };
  }, [skip, delay, effect]);

  return { isLoading };
}

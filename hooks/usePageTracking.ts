import { useEffect } from 'react';

import { useRouter } from 'next/router';
import { page } from '../utils/mixpanel';

export function usePageTracking() {
  const router = useRouter();
  useEffect(() => {
    router.events.on('routeChangeComplete', page);
    return () => router.events.off('routeChangeComplete', page);
  }, [router.events]);
}

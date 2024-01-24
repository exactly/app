import { useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';

const ACCOUNT_QUERY_PARAM = 'account';

export default function useReadOnly() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const isReadOnly = searchParams.get(ACCOUNT_QUERY_PARAM) !== null;

  const toggle = useCallback(() => {
    if (isReadOnly) {
      localStorage.setItem('account', params.get(ACCOUNT_QUERY_PARAM) || '');
      params.delete(ACCOUNT_QUERY_PARAM);
    } else {
      params.set(ACCOUNT_QUERY_PARAM, localStorage.getItem('account') || '');
    }
    router.push(`${pathname}?${params.toString()}`);
  }, [isReadOnly, params, pathname, router]);

  const setAccount = useCallback(
    (value: string) => {
      params.set(ACCOUNT_QUERY_PARAM, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [params, pathname, router],
  );

  return { isReadOnly, toggle, setAccount };
}

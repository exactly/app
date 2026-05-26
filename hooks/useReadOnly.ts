import { useCallback, useMemo } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import { useRouter } from 'next/router';
import { isAddress } from 'viem';
import { useConnection } from 'wagmi';

const ACCOUNT_QUERY_PARAM = 'account';

export default function useReadOnly() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { address } = useConnection();
  const params = useMemo(() => new URLSearchParams(searchParams.toString()), [searchParams]);
  const accountParam = searchParams.get(ACCOUNT_QUERY_PARAM);
  const readOnlyAccount = accountParam && isAddress(accountParam) ? accountParam : undefined;
  const isReadOnly = accountParam !== null;

  const exitReadOnly = useCallback(() => {
    localStorage.setItem('account', params.get(ACCOUNT_QUERY_PARAM) || '');
    params.delete(ACCOUNT_QUERY_PARAM);
    router.push(`${pathname}?${params.toString()}`);
  }, [params, pathname, router]);

  const toggle = useCallback(() => {
    if (isReadOnly) {
      exitReadOnly();
    } else {
      params.set(ACCOUNT_QUERY_PARAM, localStorage.getItem('account') || '');
      router.push(`${pathname}?${params.toString()}`);
    }
  }, [exitReadOnly, isReadOnly, params, pathname, router]);

  const setAccount = useCallback(
    (value: string) => {
      params.set(ACCOUNT_QUERY_PARAM, value);
      router.push(`${pathname}?${params.toString()}`);
    },
    [params, pathname, router],
  );

  return {
    account: readOnlyAccount ?? address,
    exitReadOnly,
    isImpersonating: Boolean(readOnlyAccount),
    isReadOnly,
    setAccount,
    toggle,
  };
}

import React, { createContext, useEffect, useState, startTransition, useRef, useContext } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { useConnect, useReconnect } from 'wagmi';
import useAccountData from 'hooks/useAccountData';
import { captureException } from '@sentry/nextjs';
import useRewards, { type Rates } from 'hooks/useRewards';

export type ContextValues = {
  lastSync: number;
  resetLastSync: () => void;
  rates: Rates;
};

const AccountDataContext = createContext<ContextValues | null>(null);

export const AccountDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const [lastSync, setLastSync] = useState<number>(Date.now());

  const { connect, connectors } = useConnect();
  const { mutate: reconnect } = useReconnect();
  const { refreshAccountData } = useAccountData();
  const { rates } = useRewards();

  const focusTimeout = useRef<number | undefined>(undefined);

  useEffect(() => {
    const safeConnector = connectors.find(({ id }) => id === 'safe');
    startTransition(() => {
      if (safeConnector) connect({ connector: safeConnector }, { onError: () => reconnect() });
      else reconnect();
    });
  }, [connect, connectors, reconnect]);

  useEffect(() => {
    const handle = () => refreshAccountData(0).catch(captureException);
    const blur = () => (focusTimeout.current = Date.now());
    const focus = () => {
      if (focusTimeout.current && Date.now() - focusTimeout.current > 60_000) {
        handle();
      }
      focusTimeout.current = undefined;
    };
    const interval = setInterval(handle, 600_000);
    window.addEventListener('focus', focus);
    window.addEventListener('blur', blur);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', focus);
      window.removeEventListener('focus', blur);
    };
  }, [refreshAccountData]);

  return (
    <AccountDataContext.Provider
      value={{
        rates,
        lastSync,
        resetLastSync: () => setLastSync(Date.now()),
      }}
    >
      {children}
    </AccountDataContext.Provider>
  );
};

export function useAccountDataContext() {
  const ctx = useContext(AccountDataContext);
  if (!ctx) {
    throw new Error('Using AccountDataContext outside of provider');
  }
  return ctx;
}

export default AccountDataContext;

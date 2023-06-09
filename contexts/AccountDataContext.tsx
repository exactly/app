import React, { createContext, useEffect, useState, startTransition, useRef } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { useConfig, useConnect } from 'wagmi';
import useAccountData from 'hooks/useAccountData';
import { captureException } from '@sentry/nextjs';

export type ContextValues = {
  lastSync: number;
  resetLastSync: () => void;
};

const AccountDataContext = createContext<ContextValues | null>(null);

export const AccountDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const [lastSync, setLastSync] = useState<number>(Date.now());

  const { connect, connectors } = useConnect();
  const client = useConfig();
  const { refreshAccountData } = useAccountData();

  const focusTimeout = useRef<number>();

  useEffect(() => {
    const safeConnector = connectors.find(({ id, ready }) => ready && id === 'safe');
    startTransition(() => {
      if (safeConnector) connect({ connector: safeConnector });
      else void client.autoConnect();
    });
  }, [client, connect, connectors]);

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
        lastSync,
        resetLastSync: () => setLastSync(Date.now()),
      }}
    >
      {children}
    </AccountDataContext.Provider>
  );
};

export default AccountDataContext;

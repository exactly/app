import React, { createContext, useCallback, useEffect, useState, startTransition } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { AddressZero } from '@ethersproject/constants';
import { captureException } from '@sentry/nextjs';
import { useClient, useConnect } from 'wagmi';

import { AccountData } from 'types/AccountData';

import { useWeb3 } from 'hooks/useWeb3';

import usePreviewer from 'hooks/usePreviewer';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { ErrorCode } from '@ethersproject/logger';

export type ContextValues = {
  accountData: AccountData | undefined;
  refreshAccountData: (delay?: number) => Promise<void>;
  resetAccountData: () => void;
};

const AccountDataContext = createContext<ContextValues | null>(null);

export const AccountDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData | undefined>();

  const { connect, connectors } = useConnect();
  const { walletAddress } = useWeb3();
  const client = useClient();

  const resetAccountData = useCallback(() => setAccountData(undefined), []);

  useEffect(() => {
    const safeConnector = connectors.find(({ id, ready }) => ready && id === 'safe');
    startTransition(() => {
      if (safeConnector) connect({ connector: safeConnector });
      else void client.autoConnect();
    });
  }, [client, connect, connectors]);

  const previewer = usePreviewer();

  const queryAccountData = useCallback(async () => {
    if (!previewer) return;

    const account = walletAddress ?? AddressZero;

    try {
      const exactly = await previewer.exactly(account);
      return Object.fromEntries(exactly.map((market) => [market.assetSymbol, market]));
    } catch (error) {
      const e = error as { code: ErrorCode };
      if (e.code !== ErrorCode.CALL_EXCEPTION) captureException(error);
      return undefined;
    }
  }, [previewer, walletAddress]);

  const syncAccountData = useCallback(
    async (cancelled?: () => boolean) => {
      const data = await queryAccountData();
      if (cancelled?.()) return;
      setAccountData(data);
    },
    [queryAccountData],
  );

  useDelayedEffect({
    effect: syncAccountData,
    delay: 500,
  });

  const refreshAccountData = useCallback(
    async (delay = 2500) => new Promise<void>((r) => setTimeout(() => syncAccountData().then(r), delay)),
    [syncAccountData],
  );

  useEffect(() => {
    const handle = () => syncAccountData().catch(captureException);
    const interval = setInterval(handle, 600_000);
    window.addEventListener('focus', handle);
    return () => {
      clearInterval(interval);
      window.removeEventListener('focus', handle);
    };
  }, [syncAccountData]);

  return (
    <AccountDataContext.Provider
      value={{
        accountData,
        refreshAccountData,
        resetAccountData,
      }}
    >
      {children}
    </AccountDataContext.Provider>
  );
};

export default AccountDataContext;

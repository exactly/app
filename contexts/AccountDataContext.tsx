import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { AddressZero } from '@ethersproject/constants';
import { captureException } from '@sentry/nextjs';
import { useClient, useConnect } from 'wagmi';

import { AccountData } from 'types/AccountData';

import { useWeb3 } from 'hooks/useWeb3';

import usePreviewer from 'hooks/usePreviewer';

type ContextValues = {
  accountData: AccountData | undefined;
  getAccountData: () => Promise<AccountData | undefined>;
};

const AccountDataContext = createContext<ContextValues>({
  accountData: undefined,
  getAccountData: () => Promise.resolve({}),
});

export const AccountDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData | undefined>();
  const { connect, connectors } = useConnect();
  const { walletAddress } = useWeb3();
  const client = useClient();

  useEffect(() => {
    const safeConnector = connectors.find(({ id, ready }) => ready && id === 'safe');
    if (safeConnector) connect({ connector: safeConnector });
    else void client.autoConnect();
  }, [client, connect, connectors]);

  const previewer = usePreviewer();

  const getAccountData = useCallback(async () => {
    if (!previewer) return;

    const account = walletAddress ?? AddressZero;

    const exactly = await previewer.exactly(account);

    const data = Object.fromEntries(exactly.map((market) => [market.assetSymbol, market]));
    setAccountData(data);
    return data;
  }, [walletAddress, previewer]);

  useEffect(() => {
    void getAccountData();

    const interval = setInterval(() => getAccountData().catch(captureException), 600_000);
    return () => clearInterval(interval);
  }, [getAccountData]);

  return <AccountDataContext.Provider value={{ accountData, getAccountData }}>{children}</AccountDataContext.Provider>;
};

export default AccountDataContext;

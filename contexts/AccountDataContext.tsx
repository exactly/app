import React, { createContext, useCallback, useEffect, useState } from 'react';
import type { FC, PropsWithChildren } from 'react';
import { AddressZero } from '@ethersproject/constants';
import { captureException } from '@sentry/nextjs';

import { AccountData } from 'types/AccountData';

import { useWeb3 } from 'hooks/useWeb3';

import usePreviewer from 'hooks/usePreviewer';

type ContextValues = {
  accountData: AccountData | undefined;
  getAccountData: () => Promise<AccountData | undefined>;
};

const AccountDataContext = createContext({
  accountData: undefined,
  getAccountData: () => Promise.resolve({}),
} as ContextValues);

export const AccountDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData | undefined>(undefined);
  const { walletAddress } = useWeb3();

  const previewer = usePreviewer();

  const getAccountData = useCallback(async () => {
    if (!previewer) return undefined;
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

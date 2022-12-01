import React, { FC, useCallback, createContext, useEffect, useState, PropsWithChildren } from 'react';
import { AddressZero } from '@ethersproject/constants';
import { captureException } from '@sentry/nextjs';

import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

import { useWeb3Context } from './Web3Context';

import useDebounce from 'hooks/useDebounce';
import usePreviewer from 'hooks/usePreviewer';

type ContextValues = {
  accountData: AccountData | undefined;
  getAccountData: () => Promise<void>;
};

const defaultValues: ContextValues = {
  accountData: undefined,
  getAccountData: async () => undefined,
};

const AccountDataContext = createContext(defaultValues);

export const AccountDataProvider: FC<PropsWithChildren> = ({ children }) => {
  const [accountData, setAccountData] = useState<AccountData | undefined>();
  const { walletAddress } = useWeb3Context();
  const Previewer = usePreviewer();

  const walletAddressDebounced = useDebounce(walletAddress);

  const getAccountData = useCallback(async () => {
    if (!Previewer) return;

    const wallet = walletAddressDebounced ? walletAddressDebounced : AddressZero;

    const data = await Previewer.exactly(wallet);

    setAccountData(Object.fromEntries(data.map((market: FixedLenderAccountData) => [market.assetSymbol, market])));
  }, [Previewer, walletAddressDebounced]);

  useEffect(() => {
    void getAccountData().catch(captureException);
  }, [getAccountData]);

  useEffect(() => {
    const interval = setInterval(() => void getAccountData().catch(captureException), 600000);
    return () => clearInterval(interval);
  }, [getAccountData]);

  return <AccountDataContext.Provider value={{ accountData, getAccountData }}>{children}</AccountDataContext.Provider>;
};

export default AccountDataContext;

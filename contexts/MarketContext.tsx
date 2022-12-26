import React, { type FC, useMemo, createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import dayjs from 'dayjs';

import { Address } from 'types/Address';
import { Maturity } from 'types/Date';

import AccountDataContext from './AccountDataContext';
import type { Previewer } from 'types/contracts';

type ContextValues = {
  market: Address | undefined;
  account: Previewer.MarketAccountStructOutput | undefined;
  setMarket: (address: Address) => void;
  date: Maturity | undefined;
  setDate: (date: Maturity) => void;
  dates: Maturity[];
};

const defaultValues: ContextValues = {
  market: undefined,
  account: undefined,
  setMarket: () => undefined,
  date: undefined,
  setDate: () => undefined,
  dates: [],
};

const MarketContext = createContext<ContextValues>(defaultValues);

const MarketProvider: FC<PropsWithChildren> = ({ children }) => {
  const [market, setMarket] = useState<Address>();
  const [date, setDate] = useState<Maturity>();

  const { accountData } = useContext(AccountDataContext);

  const dates = useMemo<Maturity[]>(() => {
    const currentTimestamp = dayjs().unix();
    const interval = 2_419_200;
    let timestamp = currentTimestamp - (currentTimestamp % interval);
    const maxPools = accountData?.maxFuturePools ?? 3;

    const pools: number[] = [];

    for (let i = 0; i < maxPools; i++) {
      timestamp += interval;
      pools.push(timestamp);
    }

    const formattedDates = pools.map((pool: number) => pool.toString());

    return formattedDates;
  }, [accountData?.maxFuturePools]);

  useEffect(() => {
    if (dates.length && !date) {
      setDate(dates[0]);
    }
  }, [accountData, date, dates]);

  const account = useMemo(
    () =>
      accountData && market
        ? Object.values(accountData).find((m) => m.market.toLowerCase() === market.toLowerCase())
        : undefined,
    [accountData, market],
  );

  return (
    <MarketContext.Provider value={{ market, account, setMarket, date, setDate, dates }}>
      {children}
    </MarketContext.Provider>
  );
};

export { MarketContext, MarketProvider };

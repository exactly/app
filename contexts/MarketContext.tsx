import React, { type FC, useMemo, createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import dayjs from 'dayjs';

import AccountDataContext from './AccountDataContext';

type ContextValues = {
  marketSymbol: string | undefined;
  setMarketSymbol: (symbol: string) => void;
  date: number | undefined;
  setDate: (date: number) => void;
  dates: number[];
};

const defaultValues: ContextValues = {
  marketSymbol: undefined,
  setMarketSymbol: () => undefined,
  date: undefined,
  setDate: () => undefined,
  dates: [],
};

const MarketContext = createContext<ContextValues>(defaultValues);

const MarketProvider: FC<PropsWithChildren> = ({ children }) => {
  const [marketSymbol, setMarketSymbol] = useState<string>();
  const [date, setDate] = useState<number>();

  const { accountData } = useContext(AccountDataContext);

  const dates = useMemo<number[]>(() => {
    const currentTimestamp = dayjs().unix();
    const interval = 2_419_200;
    let timestamp = currentTimestamp - (currentTimestamp % interval);
    const maxPools = accountData?.maxFuturePools ?? 3;

    const pools: number[] = [];

    for (let i = 0; i < maxPools; i++) {
      timestamp += interval;
      pools.push(timestamp);
    }

    return pools;
  }, [accountData?.maxFuturePools]);

  useEffect(() => {
    if (dates.length && !date) {
      setDate(dates[0]);
    }
  }, [accountData, date, dates]);

  return (
    <MarketContext.Provider value={{ marketSymbol, setMarketSymbol, date, setDate, dates }}>
      {children}
    </MarketContext.Provider>
  );
};

export { MarketContext, MarketProvider };

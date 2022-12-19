import React, { type FC, useMemo, createContext, useContext, useEffect, useState, type PropsWithChildren } from 'react';
import dayjs from 'dayjs';

import { Address } from 'types/Address';
import { Date } from 'types/Date';

import parseTimestamp from 'utils/parseTimestamp';

import AccountDataContext from './AccountDataContext';
import type { Previewer } from 'types/contracts';

type ContextValues = {
  market: Address | undefined;
  account: Previewer.MarketAccountStructOutput | undefined;
  setMarket: (address: Address) => void;
  date: Date | undefined;
  setDate: (date: Date) => void;
  dates: Date[];
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
  const [date, setDate] = useState<Date>();

  const { accountData } = useContext(AccountDataContext);

  const dates = useMemo<Date[]>(() => {
    const currentTimestamp = dayjs().unix();
    const interval = 2419200;
    let timestamp = currentTimestamp - (currentTimestamp % interval);
    const maxPools = accountData?.maxFuturePools ?? 3;

    const pools: number[] = [];

    for (let i = 0; i < maxPools; i++) {
      timestamp += interval;
      pools.push(timestamp);
    }

    const formattedDates = pools.map((pool: number) => {
      return {
        value: pool.toString(),
        label: parseTimestamp(pool),
      };
    });

    return formattedDates;
  }, [accountData?.maxFuturePools]);

  useEffect(() => {
    if (dates.length && !date) {
      setDate(dates[0]);
    }
  }, [accountData, date, dates]);

  const account = useMemo(
    () =>
      accountData && Object.values(accountData).find((m) => m.market.toLowerCase() === market?.value?.toLowerCase()),
    [accountData, market],
  );

  return (
    <MarketContext.Provider value={{ market, account, setMarket, date, setDate, dates }}>
      {children}
    </MarketContext.Provider>
  );
};

export { MarketContext, MarketProvider };

import React, { FC, ReactNode, useMemo, createContext, useContext, useEffect, useState, useCallback } from 'react';
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

const MarketContext = createContext(defaultValues);

const MarketProvider: FC<{ children?: ReactNode }> = ({ children }) => {
  const [market, setMarket] = useState<Address>();
  const [date, setDate] = useState<Date>();
  const [dates, setDates] = useState<Date[]>([]);

  const { accountData } = useContext(AccountDataContext);

  const getPools = useCallback(async () => {
    try {
      const currentTimestamp = dayjs().unix();
      const interval = 2419200;
      let timestamp = currentTimestamp - (currentTimestamp % interval);
      const maxPools = accountData?.maxFuturePools ?? 3;

      const pools = [];

      for (let i = 0; i < maxPools; i++) {
        timestamp += interval;
        pools.push(timestamp);
      }

      const dates = pools?.map((pool: any) => {
        return pool.toString();
      });

      const formattedDates = dates?.map((date: any) => {
        return {
          value: date,
          label: parseTimestamp(date),
        };
      });

      setDates(formattedDates);

      !date && formattedDates && setDate(formattedDates[0]);
    } catch (e) {
      console.log(e);
    }
  }, [accountData?.maxFuturePools, date]);

  useEffect(() => {
    getPools();
  }, [accountData, getPools]);

  const account = useMemo(
    () => accountData && Object.values(accountData).find((m) => m.market.toLowerCase() === market?.value.toLowerCase()),
    [accountData, market],
  );

  return (
    <MarketContext.Provider value={{ market, account, setMarket, date, setDate, dates }}>
      {children}
    </MarketContext.Provider>
  );
};

export { MarketContext, MarketProvider };

import React, { type FC, useMemo, createContext, useEffect, useState, type PropsWithChildren } from 'react';
import dayjs from 'dayjs';
import { useWeb3 } from 'hooks/useWeb3';

type ContextValues = {
  marketSymbol: string | undefined;
  setMarketSymbol: (symbol: string) => void;
  date: number | undefined;
  setDate: (date: number) => void;
  dates: number[];
  view?: MarketView;
  setView: (view: MarketView) => void;
};

export type MarketView = 'simple' | 'advanced';

const defaultValues: ContextValues = {
  marketSymbol: undefined,
  setMarketSymbol: () => undefined,
  date: undefined,
  setDate: () => undefined,
  dates: [],
  view: undefined,
  setView: () => undefined,
};

const MarketContext = createContext<ContextValues>(defaultValues);

const MarketProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chain } = useWeb3();
  const [view, setView] = useState<MarketView>();
  const [marketSymbol, setMarketSymbol] = useState<string>('USDC');
  const [date, setDate] = useState<number>();

  const dates = useMemo<number[]>(() => {
    const currentTimestamp = dayjs().unix();
    const maxPools = 3;
    const interval = 2_419_200;
    let timestamp = currentTimestamp - (currentTimestamp % interval);

    const pools: number[] = [];

    for (let i = 0; i < maxPools; i++) {
      timestamp += interval;
      pools.push(timestamp);
    }

    return pools;
  }, []);

  useEffect(() => {
    if (dates.length && !date) {
      setDate(dates[0]);
    }
  }, [date, dates]);

  useEffect(() => {
    setView((localStorage.getItem('marketView') as MarketView) || 'simple');
  }, [setView]);

  useEffect(() => {
    setMarketSymbol('USDC');
  }, [chain.id]);

  const setViewLocalStorage = (newView: MarketView) => {
    localStorage.setItem('marketView', newView);
    setView(newView);
  };

  return (
    <MarketContext.Provider
      value={{ marketSymbol, setMarketSymbol, date, setDate, dates, view, setView: setViewLocalStorage }}
    >
      {children}
    </MarketContext.Provider>
  );
};

export { MarketContext, MarketProvider };

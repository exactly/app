import React, {
  type FC,
  useMemo,
  createContext,
  useEffect,
  useState,
  type PropsWithChildren,
  useCallback,
  useContext,
} from 'react';
import useAccountData from 'hooks/useAccountData';
import { useWeb3 } from 'hooks/useWeb3';

type ContextValues = {
  marketSymbol: string;
  setMarketSymbol: (symbol: string) => void;
  date: number | undefined;
  setDate: (date: number) => void;
  dates: number[];
  view?: MarketView;
  setView: (view: MarketView) => void;
};

export type MarketView = 'simple' | 'advanced';

const MarketContext = createContext<ContextValues | null>(null);

export const MarketProvider: FC<PropsWithChildren> = ({ children }) => {
  const { chain } = useWeb3();
  const [view, setView] = useState<MarketView>();
  const [marketSymbol, setMarketSymbol] = useState<string>('USDC');
  const { marketAccount } = useAccountData(marketSymbol);
  const [date, setDate] = useState<number>();

  const dates = useMemo<number[]>(
    () => marketAccount?.fixedPools.map((pool) => Number(pool.maturity)) ?? [],
    [marketAccount],
  );

  useEffect(() => {
    if (dates.length && !date) {
      setDate(dates[0]);
    }
  }, [date, dates]);

  useEffect(() => {
    setView((localStorage.getItem('marketView') as MarketView) || 'simple');
  }, [setView]);

  useEffect(() => setMarketSymbol('USDC'), [chain.id]);

  const setViewLocalStorage = useCallback(
    (newView: MarketView) => {
      localStorage.setItem('marketView', newView);
      setView(newView);
    },
    [setView],
  );

  return (
    <MarketContext.Provider
      value={{ marketSymbol, setMarketSymbol, date, setDate, dates, view, setView: setViewLocalStorage }}
    >
      {view === undefined ? null : children}
    </MarketContext.Provider>
  );
};

export const useMarketContext = () => {
  const ctx = useContext(MarketContext);
  if (!ctx) {
    throw new Error('Using MarketContext outside of provider');
  }
  return ctx;
};

export default MarketContext;

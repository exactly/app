import React, { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from 'styles/theme';
import useClientLocalStorage from 'hooks/useClientLocalStorage';
import { aprToAPY as _aprToAPY } from 'utils/utils';

export type MarketView = 'simple' | 'advanced';

type ContextValues = {
  theme: 'light' | 'dark';
  changeTheme: () => void;
  view?: MarketView;
  setView: (view: MarketView) => void;
  showAPR?: true | false;
  setShowAPR: (showAPR: true | false) => void;
  aprToAPY: (apr: bigint, interval?: bigint) => bigint;
};

const defaultValues: ContextValues = {
  theme: 'light',
  changeTheme: () => undefined,
  view: 'simple',
  setView: () => undefined,
  showAPR: true,
  setShowAPR: () => undefined,
  aprToAPY: () => 0n,
};

const ThemeContext = createContext(defaultValues);

export const ThemeProvider: FC<PropsWithChildren> = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    const storageThemeRaw = window?.localStorage?.getItem('theme');
    if (storageThemeRaw) {
      const storageTheme = storageThemeRaw && JSON.parse(storageThemeRaw);

      if (storageTheme && (storageTheme === 'light' || storageTheme === 'dark')) {
        document.body.dataset.theme = storageTheme;
        setTheme(storageTheme);
      }
    } else {
      const colorScheme = window?.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      setTheme(colorScheme);
      if (window?.localStorage) {
        window.localStorage.setItem('theme', JSON.stringify(colorScheme));
      }
    }
  }, []);

  const changeTheme = useCallback(() => {
    const target = theme === 'light' ? 'dark' : 'light';
    setTheme(target);
    localStorage.setItem('theme', JSON.stringify(target));
  }, [theme]);

  useEffect(() => {
    if (document?.body?.dataset?.theme && document?.body?.dataset?.theme !== theme) {
      document.body.dataset.theme = theme;
    }
  }, [theme, changeTheme]);

  const [view, setView] = useClientLocalStorage('marketView', defaultValues.view);
  const [showAPR, setShowAPR] = useClientLocalStorage('showAPR', true as true | false);

  const aprToAPY = useCallback(
    (apr: bigint, interval = 86_400n) => (showAPR ? apr : _aprToAPY(apr, interval)),
    [showAPR],
  );

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, view, setView, showAPR, setShowAPR, aprToAPY }}>
      <MUIThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>
        {view === undefined ? null : children}
      </MUIThemeProvider>
    </ThemeContext.Provider>
  );
};

export function useCustomTheme() {
  const ctx = useContext(ThemeContext);
  if (!ctx) {
    throw new Error('Using ThemeContext outside of provider');
  }
  return ctx;
}

export default ThemeContext;

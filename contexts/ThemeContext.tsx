import React, { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from 'styles/theme';
import useClientLocalStorage from 'hooks/useClientLocalStorage';

export type MarketView = 'simple' | 'advanced';

type ContextValues = {
  theme: 'light' | 'dark';
  changeTheme: () => void;
  view?: MarketView;
  setView: (view: MarketView) => void;
};

const defaultValues: ContextValues = {
  theme: 'light',
  changeTheme: () => undefined,
  view: 'advanced',
  setView: () => undefined,
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

  return (
    <ThemeContext.Provider value={{ theme, changeTheme, view, setView }}>
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

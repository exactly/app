import React, { createContext, FC, PropsWithChildren, useCallback, useContext, useEffect, useState } from 'react';
import { ThemeProvider as MUIThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from 'styles/theme';

type ContextValues = {
  theme: 'light' | 'dark';
  changeTheme: () => void;
};

const defaultValues: ContextValues = {
  theme: 'light',
  changeTheme: () => undefined,
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
      if (window?.localStorage) {
        window.localStorage.setItem('theme', JSON.stringify('light'));
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

  return (
    <ThemeContext.Provider value={{ theme, changeTheme }}>
      <MUIThemeProvider theme={theme === 'light' ? lightTheme : darkTheme}>{children}</MUIThemeProvider>
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

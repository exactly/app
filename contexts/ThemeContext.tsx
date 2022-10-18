import { createContext, FC, useEffect, useState } from 'react';

type ContextValues = {
  theme: 'light' | 'dark';
  changeTheme: () => void;
};

const defaultValues: ContextValues = {
  theme: 'light',
  changeTheme: () => {}
};

const ThemeContext = createContext(defaultValues);

export const ThemeProvider: FC = ({ children }) => {
  const [theme, setTheme] = useState<'light' | 'dark'>('light');

  useEffect(() => {
    if (window?.localStorage?.getItem('theme')) {
      const storage = window?.localStorage?.getItem('theme');
      const storageTheme = storage && JSON.parse(storage);

      if (
        storageTheme &&
        storageTheme != '' &&
        (storageTheme == 'light' || storageTheme == 'dark')
      ) {
        document.body.dataset.theme = storageTheme;
        // setTheme(storageTheme);
        setTheme('light'); //HACK disabling the darkmode option, force the light theme if the user change the localStorage
      }
    } else {
      if (window?.localStorage) {
        window.localStorage.setItem('theme', JSON.stringify('light'));
      }
    }
  }, []);

  useEffect(() => {
    if (document?.body?.dataset?.theme && document?.body?.dataset?.theme != theme) {
      document.body.dataset.theme = theme;
    }
  }, [theme, changeTheme]);

  function changeTheme() {
    switch (theme) {
      case 'light':
        setTheme('dark');
        localStorage.setItem('theme', JSON.stringify('dark'));
        break;
      case 'dark':
        setTheme('light');
        localStorage.setItem('theme', JSON.stringify('light'));
        break;
    }
  }

  return <ThemeContext.Provider value={{ theme, changeTheme }}>{children}</ThemeContext.Provider>;
};

export default ThemeContext;

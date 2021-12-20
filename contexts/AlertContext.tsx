import React, { createContext, FC, useState } from 'react';
import { Alert } from 'types/Alert';

type ContextValues = {
  alert: Alert | undefined;
  setAlert: (address: Alert | undefined) => void;
};

const defaultValues: ContextValues = {
  alert: undefined,
  setAlert: () => {}
};

const AlertContext = createContext(defaultValues);

const AlertProvider: FC = ({ children }) => {
  const [alert, setAlert] = useState<Alert>();

  return (
    <AlertContext.Provider value={{ alert, setAlert }}>
      {children}
    </AlertContext.Provider>
  );
};

export { AlertContext, AlertProvider };

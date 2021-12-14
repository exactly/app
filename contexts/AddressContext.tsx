import React, { createContext, FC, useState } from 'react';
import { Address } from 'types/Address';
import { Date } from 'types/Date';

type ContextValues = {
  address: Address | undefined;
  setAddress: (address: Address) => void;
  date: Date | undefined;
  setDate: (date: Date) => void;
};

const defaultValues: ContextValues = {
  address: undefined,
  setAddress: () => {},
  date: undefined,
  setDate: () => {}
};

const AddressContext = createContext(defaultValues);

const AddressProvider: FC = ({ children }) => {
  const [address, setAddress] = useState<Address>();
  const [date, setDate] = useState<Date>();

  return (
    <AddressContext.Provider value={{ address, setAddress, date, setDate }}>
      {children}
    </AddressContext.Provider>
  );
};

export { AddressContext, AddressProvider };

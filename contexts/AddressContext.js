import React, { createContext, useState, useEffect } from 'react';

const AddressContext = createContext();

const AddressProvider = ({ children }) => {
  const [address, setAddress] = useState(undefined);
  const [date, setDate] = useState(undefined);

  return (
    <AddressContext.Provider value={{ address, setAddress, date, setDate }}>
      {children}
    </AddressContext.Provider>
  );
};

export { AddressContext, AddressProvider };

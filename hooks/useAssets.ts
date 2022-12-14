import { useContext, useMemo } from 'react';
import AccountDataContext from '../contexts/AccountDataContext';

export default (): string[] => {
  const { accountData } = useContext(AccountDataContext);
  return useMemo<string[]>(() => Object.keys(accountData ?? {}), [accountData]);
};

import { useMemo } from 'react';
import useAccountData from './useAccountData';

export default (): string[] => {
  const { accountData } = useAccountData();

  return useMemo<string[]>(() => accountData?.map((m) => m.asset.toLowerCase()) ?? [], [accountData]);
};

import { useMemo } from 'react';
import useAccountData from './useAccountData';

const def = ['WETH', 'USDC', 'DAI'];

export default (): string[] => {
  const { accountData } = useAccountData();
  return useMemo<string[]>(() => (accountData ? accountData.map((m) => m.assetSymbol) : def), [accountData]);
};

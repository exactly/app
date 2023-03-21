import { formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';
import { useMemo } from 'react';
import useAccountData from './useAccountData';

const def = ['USDC', 'WETH', 'DAI'];

export default (): string[] => {
  const { accountData } = useAccountData();

  if (accountData) {
    accountData.sort((a, b) => {
      return (
        parseFloat(formatFixed(b.totalFloatingDepositAssets.mul(b.usdPrice).div(WeiPerEther), b.decimals)) -
        parseFloat(formatFixed(a.totalFloatingDepositAssets.mul(a.usdPrice).div(WeiPerEther), a.decimals))
      );
    });
  }

  return useMemo<string[]>(() => (accountData ? accountData.map((m) => m.assetSymbol) : def), [accountData]);
};

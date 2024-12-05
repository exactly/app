import { MarketAccount } from 'hooks/useAccountData';
import getVouchersPrice from './getVouchersPrice';
import { Rewards } from 'contexts/StakeEXAContext';

export const calculateStakingRewardsAPR = (
  totalAssets: bigint | undefined,
  rewards: readonly Rewards[] | undefined,
  accountData: readonly MarketAccount[] | undefined,
  exaPrice: bigint,
) => {
  if (!totalAssets || !rewards || !accountData) return [];

  return rewards.map(({ symbol, rate }) => {
    const yearInSeconds = 31_536_000n;

    const rewardPrice = symbol === 'EXA' ? exaPrice : getVouchersPrice(accountData, symbol);
    const decimals = accountData.find((token) => token.symbol.includes(symbol))?.decimals || 18;

    const apr = Number((rate * yearInSeconds * rewardPrice * 100n) / (totalAssets * exaPrice)) / 10 ** decimals;

    return { symbol, apr };
  });
};

export const calculateTotalStakingRewardsAPR = (rewardsAPR: Array<{ symbol: string; apr: number }>) => {
  if (!rewardsAPR) return 0n;
  return rewardsAPR.reduce((acc, { apr }) => acc + apr, 0);
};

import { formatUnits } from 'viem';
import { useMarketContext } from 'contexts/MarketContext';
import useAccountData from './useAccountData';

export default (symbol: string): number | undefined => {
  const { date: maturityDate } = useMarketContext();
  const { marketAccount } = useAccountData(symbol);

  if (!marketAccount || !maturityDate) return;

  const { fixedPools, decimals } = marketAccount;

  const maturityData = fixedPools.find(({ maturity }) => maturity === BigInt(maturityDate));

  if (!maturityData) return;

  return Number(formatUnits(maturityData.available, decimals)) ?? undefined;
};

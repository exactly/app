import { formatUnits } from 'viem';
import usePreviewerExactly from './usePreviewerExactly';
import { useOperationContext } from 'contexts/OperationContext';

export default (symbol: string): number | undefined => {
  const { date: maturityDate } = useOperationContext();
  const marketAccount = usePreviewerExactly().data?.find((market) => market.assetSymbol === symbol);

  if (!marketAccount || !maturityDate) return;

  const { fixedPools, decimals } = marketAccount;

  const maturityData = fixedPools.find(({ maturity }) => maturity === maturityDate);

  if (!maturityData) return;

  return Number(formatUnits(maturityData.available, decimals)) ?? undefined;
};

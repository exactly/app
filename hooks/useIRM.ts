import usePreviewerExactly from './usePreviewerExactly';

export default function useIRM(symbol: string) {
  const marketAccount = usePreviewerExactly().data?.find((market) => market.assetSymbol === symbol);
  if (!marketAccount) return;
  if ('parameters' in marketAccount.interestRateModel) return marketAccount?.interestRateModel?.parameters;
}

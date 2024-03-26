import useAccountData from './useAccountData';

export default function useIRM(symbol: string) {
  const { marketAccount } = useAccountData(symbol);
  if (!marketAccount) return;
  if ('parameters' in marketAccount.interestRateModel) return marketAccount?.interestRateModel?.parameters;
}

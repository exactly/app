import useAccountData from './useAccountData';

export default function useIRM(symbol: string) {
  const { marketAccount } = useAccountData(symbol);
  return marketAccount?.interestRateModel?.parameters;
}

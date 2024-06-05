import globalUtilization from '@exactly/lib/esm/interest-rate-model/globalUtilization';
import useAccountData from './useAccountData';

export default (symbol: string) => {
  const { marketAccount } = useAccountData(symbol);
  if (!marketAccount) return undefined;

  const { totalFloatingDepositAssets, totalFloatingBorrowAssets, floatingBackupBorrowed } = marketAccount;
  if (totalFloatingDepositAssets == null || totalFloatingBorrowAssets == null || floatingBackupBorrowed == null) {
    return undefined;
  }

  return globalUtilization(totalFloatingDepositAssets, totalFloatingBorrowAssets, floatingBackupBorrowed);
};

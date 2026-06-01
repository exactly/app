import { globalUtilization } from '@exactly/lib';
import usePreviewerExactly from './usePreviewerExactly';

export default (symbol: string) => {
  const marketAccount = usePreviewerExactly().data?.find((market) => market.assetSymbol === symbol);
  if (!marketAccount) return undefined;

  const { totalFloatingDepositAssets, totalFloatingBorrowAssets, floatingBackupBorrowed } = marketAccount;
  if (totalFloatingDepositAssets == null || totalFloatingBorrowAssets == null || floatingBackupBorrowed == null) {
    return undefined;
  }

  return globalUtilization(totalFloatingDepositAssets, totalFloatingBorrowAssets, floatingBackupBorrowed);
};

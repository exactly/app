import { MarketAccount } from 'hooks/useAccountData';
import { parseUnits } from 'viem';
import { WEI_PER_ETHER } from './const';

function getBeforeBorrowLimit(marketAccount: MarketAccount, type: string): bigint {
  const { maxBorrowAssets, usdPrice, decimals, isCollateral, floatingDepositAssets, adjustFactor } = marketAccount;

  const decimalWAD = parseUnits('1', decimals);
  let before = (maxBorrowAssets * usdPrice) / decimalWAD;

  const hasDepositedToFloatingPool = floatingDepositAssets > 0n;

  if (!isCollateral && hasDepositedToFloatingPool && type === 'borrow') {
    before =
      before +
      (((((floatingDepositAssets * usdPrice) / decimalWAD) * adjustFactor) / WEI_PER_ETHER) * adjustFactor) /
        WEI_PER_ETHER;
  }

  return before;
}

export default getBeforeBorrowLimit;

import { MarketAccount } from 'hooks/useAccountData';
import { parseUnits } from 'viem';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

function getBeforeBorrowLimit(marketAccount: MarketAccount, type: string): bigint {
  const { maxBorrowAssets, usdPrice, decimals, isCollateral, floatingDepositAssets, adjustFactor } = marketAccount;

  const decimalWAD = parseUnits('1', decimals);
  let before = (maxBorrowAssets * usdPrice) / decimalWAD;

  const hasDepositedToFloatingPool = floatingDepositAssets > 0n;

  if (!isCollateral && hasDepositedToFloatingPool && type === 'borrow') {
    before = before + (((((floatingDepositAssets * usdPrice) / decimalWAD) * adjustFactor) / WAD) * adjustFactor) / WAD;
  }

  return before;
}

export default getBeforeBorrowLimit;

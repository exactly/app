import { MarketAccount } from 'hooks/usePreviewerExactly';
import { parseUnits } from 'viem';
import { WAD } from '@exactly/lib';

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

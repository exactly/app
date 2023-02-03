import type { BigNumber } from '@ethersproject/bignumber';
import { parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther, Zero } from '@ethersproject/constants';

import { Previewer } from 'types/contracts/Previewer';

function getBeforeBorrowLimit(marketAccount: Previewer.MarketAccountStructOutput, type: string): BigNumber {
  const { maxBorrowAssets, usdPrice, decimals, isCollateral, floatingDepositAssets, adjustFactor } = marketAccount;

  const decimalWAD = parseFixed('1', decimals);
  let before = maxBorrowAssets.mul(usdPrice).div(decimalWAD);

  const hasDepositedToFloatingPool = floatingDepositAssets.gt(Zero);

  if (!isCollateral && hasDepositedToFloatingPool && type === 'borrow') {
    before = maxBorrowAssets.add(
      floatingDepositAssets
        .mul(usdPrice)
        .div(decimalWAD)
        .mul(adjustFactor)
        .div(WeiPerEther)
        .mul(adjustFactor)
        .div(WeiPerEther),
    );
  }

  return before;
}

export default getBeforeBorrowLimit;

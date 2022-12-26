import type { BigNumber } from '@ethersproject/bignumber';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

import { AccountData } from 'types/AccountData';

function getBeforeBorrowLimit(
  accountData: AccountData,
  symbol: string,
  usdPrice: BigNumber,
  decimals: number,
  type: string,
) {
  const maxBorrowAssets = accountData[symbol].maxBorrowAssets;

  let before = maxBorrowAssets.mul(usdPrice).div(parseFixed('1', decimals));

  const hasDepositedToFloatingPool = Number(formatFixed(accountData[symbol].floatingDepositAssets, decimals)) > 0;

  if (!accountData[symbol].isCollateral && hasDepositedToFloatingPool && type === 'borrow') {
    before = maxBorrowAssets.add(
      accountData[symbol].floatingDepositAssets.mul(accountData[symbol].adjustFactor).div(WeiPerEther),
    );
  }

  return before;
}

export default getBeforeBorrowLimit;

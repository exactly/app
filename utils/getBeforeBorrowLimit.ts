import { BigNumber } from 'ethers';
import { formatFixed, parseFixed } from '@ethersproject/bignumber';

import { AccountData } from 'types/AccountData';

function getBeforeBorrowLimit(
  accountData: AccountData,
  symbol: string,
  oraclePrice: BigNumber,
  decimals: number,
  type: string
) {
  const maxBorrowAssets = accountData![symbol.toUpperCase()].maxBorrowAssets;
  const WAD = parseFixed('1', 18);

  let before = maxBorrowAssets.mul(oraclePrice).div(parseFixed('1', decimals));

  const hasDepositedToFloatingPool =
    Number(formatFixed(accountData![symbol].floatingDepositAssets, decimals)) > 0;

  if (
    !accountData![symbol.toUpperCase()].isCollateral &&
    hasDepositedToFloatingPool &&
    type == 'borrow'
  ) {
    before = maxBorrowAssets.add(
      accountData![symbol].floatingDepositAssets.mul(accountData![symbol].adjustFactor).div(WAD)
    );
  }

  return before;
}

export default getBeforeBorrowLimit;

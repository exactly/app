import type { BigNumber } from '@ethersproject/bignumber';
import { formatFixed } from '@ethersproject/bignumber';
import { WAD } from './queryRates';

function parseHealthFactor(debt: BigNumber, collateral: BigNumber) {
  //TODO => check case when the user doesn't have any collateral or debt

  if (collateral.isZero() && debt.isZero()) {
    return '∞';
  } else if (!debt.isZero()) {
    const healthFactor = collateral.mul(WAD).div(debt);

    const formatedHealthFactor = Number(formatFixed(healthFactor, 18));

    let decimals = 0;

    if (formatedHealthFactor < 10) {
      decimals = 2;
    }

    if (formatedHealthFactor > 100) {
      return '∞';
    }

    return `${formatedHealthFactor.toFixed(decimals)}x`;
  }

  return '∞';
}
export default parseHealthFactor;

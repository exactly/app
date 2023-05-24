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

    if (formatedHealthFactor > 100) {
      return '∞';
    }

    const decimalPrecision = formatedHealthFactor < 10 ? 3 : 0;
    const factor = Math.pow(10, decimalPrecision);
    const healthFactorRounded = Math.floor(formatedHealthFactor * factor) / factor;

    return `${healthFactorRounded.toFixed(decimalPrecision)}x`;
  }

  return '∞';
}
export default parseHealthFactor;

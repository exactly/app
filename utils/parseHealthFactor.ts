import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber } from 'ethers';
import { WAD } from './fixedPointMathLib';

function parseHealthFactor(debt: BigNumber, collateral: BigNumber) {
  //TODO => check case when the user doesn't have any collateral or debt

  if (collateral.isZero() || debt.isZero()) {
    return '∞';
  } else {
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
}
export default parseHealthFactor;

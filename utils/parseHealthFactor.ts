import { formatFixed } from '@ethersproject/bignumber';
import { BigNumber, ethers } from 'ethers';
import { WAD } from './fixedPointMathLib';

function parseHealthFactor(debt: BigNumber, collateral: BigNumber) {
  //TODO => check case when the user doesn't have any collateral or debt

  if (collateral.isZero() || debt.isZero()) {
    return '∞';
  } else {
    const healthFactor = collateral.mul(WAD).div(debt);

    const formatHealthFactor = Number(ethers.utils.formatUnits(healthFactor, 18));

    let decimals = 0;

    if (formatHealthFactor < 10) {
      decimals = 2;
    }

    if (formatHealthFactor > 100) {
      return '∞';
    }

    return `${formatHealthFactor.toFixed(decimals)}x`;
  }
}
export default parseHealthFactor;

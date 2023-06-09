import { formatUnits } from 'viem';
import { WEI_PER_ETHER } from './const';

function parseHealthFactor(debt: bigint, collateral: bigint) {
  //TODO => check case when the user doesn't have any collateral or debt

  if (collateral === 0n && debt === 0n) {
    return '∞';
  } else if (debt !== 0n) {
    const healthFactor = (collateral * WEI_PER_ETHER) / debt;

    const formatedHealthFactor = Number(formatUnits(healthFactor, 18));

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

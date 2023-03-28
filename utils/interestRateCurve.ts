import { BigNumber } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

type InterestRateCurve = (u: number) => number;
type InverseInterestRateCurve = (apr: BigNumber) => BigNumber;

export function inverseInterestRateCurve(a: BigNumber, b: BigNumber, uMax: BigNumber): InverseInterestRateCurve {
  return (apr: BigNumber) =>
    apr.mul(uMax).div(WeiPerEther).sub(b.mul(uMax).div(WeiPerEther)).sub(a).mul(WeiPerEther).div(b.sub(apr)).abs();
}

export default function interestRateCurve(a: number, b: number, uMax: number): InterestRateCurve {
  return (u: number) => a / (uMax - u) + b;
}

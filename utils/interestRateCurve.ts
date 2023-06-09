import { WEI_PER_ETHER } from './const';

type InterestRateCurve = (u: number) => number;
type InverseInterestRateCurve = (apr: bigint) => bigint;

const abs = (n: bigint): bigint => (n < 0n ? -n : n);

export function inverseInterestRateCurve(a: bigint, b: bigint, uMax: bigint): InverseInterestRateCurve {
  return (apr: bigint) =>
    abs((((apr * uMax) / WEI_PER_ETHER - (b * uMax) / WEI_PER_ETHER - a) * WEI_PER_ETHER) / (b - apr));
}

export default function interestRateCurve(a: number, b: number, uMax: number): InterestRateCurve {
  return (u: number) => (uMax >= u ? a / (uMax - u) + b : Infinity);
}

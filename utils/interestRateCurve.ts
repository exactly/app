type InterestRateCurve = (u: number) => number;

export default function interestRateCurve(a: number, b: number, uMax: number): InterestRateCurve {
  return (u: number) => a / (uMax - u) + b;
}

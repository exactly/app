import { WAD, expWad, lnWad } from './fixedMath';

type FloatingInterestRateCurve = (uFloating: bigint, uGlobal: bigint) => bigint;

export type FloatingParameters = {
  a: bigint;
  b: bigint;
  floatingNaturalUtilization: bigint;
  maxUtilization: bigint;
  sigmoidSpeed: bigint;
  growthSpeed: bigint;
  maxRate: bigint;
};

export function floatingInterestRateCurve(parameters: FloatingParameters): FloatingInterestRateCurve {
  return (uFloating: bigint, uGlobal: bigint): bigint => {
    const { a, b, maxUtilization, floatingNaturalUtilization, sigmoidSpeed, growthSpeed, maxRate } = parameters;

    const r = (a * WAD) / (maxUtilization - uFloating) + b;
    if (uGlobal === WAD) return maxRate;
    if (uGlobal === 0n) return r;
    if (uGlobal >= uFloating) {
      const sig =
        (WAD * WAD) /
        (WAD +
          expWad(
            (-sigmoidSpeed *
              (lnWad((uGlobal * WAD) / (WAD - uGlobal)) -
                lnWad((floatingNaturalUtilization * WAD) / (WAD - floatingNaturalUtilization)))) /
              WAD,
          ));
      const rate = (expWad((-growthSpeed * lnWad(WAD - (sig * uGlobal) / WAD)) / WAD) * r) / WAD;
      return rate > maxRate ? maxRate : rate;
    }
    return r;
  };
}

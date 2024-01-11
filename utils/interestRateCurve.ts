import { WAD, expWad, lnWad } from './fixedMath';

type FloatingInterestRateCurve = (uFloating: bigint, uGlobal: bigint) => bigint;

export type FloatingParameters = {
  a: bigint;
  b: bigint;
  maxUtilization: bigint;
  floatingNaturalUtilization: bigint;
  sigmoidSpeed: bigint;
  growthSpeed: bigint;
  maxRate: bigint;
};

export function floatingUtilization(assets: bigint, debt: bigint): bigint {
  return assets > 0n ? (debt * WAD) / assets : 0n;
}

export function globalUtilization(assets: bigint, debt: bigint, backupBorrowed: bigint): bigint {
  return assets > 0n ? ((debt + backupBorrowed) * WAD) / assets : 0n;
}

export function floatingInterestRateCurve(parameters: FloatingParameters): FloatingInterestRateCurve {
  return (uF: bigint, uG: bigint): bigint => {
    const { a, b, maxUtilization, floatingNaturalUtilization, sigmoidSpeed, growthSpeed, maxRate } = parameters;

    const r = (a * WAD) / (maxUtilization - uF) + b;
    if (uG === WAD) return maxRate;
    if (uG === 0n) return r;
    if (uG >= uF) {
      const sig =
        (WAD * WAD) /
        (WAD +
          expWad(
            (-sigmoidSpeed *
              (lnWad((uG * WAD) / (WAD - uG)) -
                lnWad((floatingNaturalUtilization * WAD) / (WAD - floatingNaturalUtilization)))) /
              WAD,
          ));
      const rate = (expWad((-growthSpeed * lnWad(WAD - (sig * uG) / WAD)) / WAD) * r) / WAD;
      return rate > maxRate ? maxRate : rate;
    }
    return r;
  };
}

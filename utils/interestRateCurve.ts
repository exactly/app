import { WAD, expWad, lnWad, sqrtWad } from './fixedMath';

type FloatingInterestRateCurve = (uFloating: bigint, uGlobal: bigint) => bigint;

export function floatingUtilization(assets: bigint, debt: bigint): bigint {
  return assets !== 0n ? (debt * WAD) / assets : 0n;
}

export function globalUtilization(assets: bigint, debt: bigint, backupBorrowed: bigint): bigint {
  return assets !== 0n ? ((debt + backupBorrowed) * WAD) / assets : 0n;
}

export function fixedUtilization(supplied: bigint, borrowed: bigint, assets: bigint): bigint {
  return assets !== 0n && borrowed > supplied ? ((borrowed - supplied) * WAD) / assets : 0n;
}

export type FloatingParameters = {
  a: bigint;
  b: bigint;
  maxUtilization: bigint;
  floatingNaturalUtilization: bigint;
  sigmoidSpeed: bigint;
  growthSpeed: bigint;
  maxRate: bigint;
};

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

export type FixedParameters = FloatingParameters & {
  maxPools: bigint;
  maturity: bigint;
  spreadFactor: bigint;
  timestamp?: bigint;
  timePreference: bigint;
  maturitySpeed: bigint;
};

export function fixedRate(parameters: FixedParameters, uFixed: bigint, uFloating: bigint, uGlobal: bigint): bigint {
  const { maxPools, spreadFactor, timePreference, maturitySpeed, floatingNaturalUtilization, maturity, timestamp } =
    parameters;
  const base = floatingInterestRateCurve(parameters)(uFloating, uGlobal);
  if (uFixed === 0n) return base;

  const fixedNaturalUtilization = WAD - floatingNaturalUtilization;
  const sqAlpha = (maxPools * WAD * WAD) / fixedNaturalUtilization;
  const alpha = sqrtWad(sqAlpha * WAD);
  const sqX = (maxPools * uFixed * WAD * WAD) / (uGlobal * fixedNaturalUtilization);
  const x = sqrtWad(sqX * WAD);
  const a = ((2n * WAD - sqAlpha) * WAD) / ((alpha * (WAD - alpha)) / WAD);
  const z = (a * x) / WAD + ((WAD - a) * sqX) / WAD - WAD;

  const time = timestamp !== undefined ? timestamp : BigInt(Math.floor(Date.now() / 1000));
  if (time >= maturity) throw new Error('Already matured');

  const ttm = maturity - time;
  const interval = 4n * 7n * 24n * 60n * 60n;
  const ttMaxM = maxPools * interval - (time % interval);

  return (
    (base *
      (WAD +
        (expWad((maturitySpeed * lnWad((ttm * WAD) / ttMaxM)) / WAD) * (timePreference + (spreadFactor * z) / WAD)) /
          WAD)) /
    WAD
  );
}

export function spreadModel(parameters: Omit<FixedParameters, 'maturity'>, uFloating: bigint, uGlobal: bigint) {
  const time = parameters.timestamp ? parameters.timestamp : BigInt(Math.floor(Date.now() / 1000));

  return (maturity: bigint, z: bigint) => {
    const { maxPools, spreadFactor, timePreference, maturitySpeed } = parameters;
    const base = floatingInterestRateCurve(parameters)(uFloating, uGlobal);
    if (maturity === time) return base;

    const ttm = maturity - time;
    const interval = 4n * 7n * 24n * 60n * 60n;
    const ttMaxM = maxPools * interval - (time % interval);

    return (
      (base *
        (WAD +
          (expWad((maturitySpeed * lnWad((ttm * WAD) / ttMaxM)) / WAD) * (timePreference + (spreadFactor * z) / WAD)) /
            WAD)) /
      WAD
    );
  };
}

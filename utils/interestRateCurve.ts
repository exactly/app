import { MAX_UINT256 } from './const';
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
  A: bigint;
  B: bigint;
  maxUtilization: bigint;
  naturalUtilization: bigint;
  sigmoidSpeed: bigint;
  growthSpeed: bigint;
  maxRate: bigint;
};

const EXP_THRESHOLD = 135305999368893231588n;

export function floatingInterestRateCurve(parameters: FloatingParameters): FloatingInterestRateCurve {
  return (uF: bigint, uG: bigint): bigint => {
    const { A, B, maxUtilization, naturalUtilization, sigmoidSpeed, growthSpeed, maxRate } = parameters;

    const r = (A * WAD) / (maxUtilization - uF) + B;
    if (uG === WAD) return maxRate;
    if (uG === 0n) return r;

    if (uG >= uF) {
      const auxSigmoid = lnWad((naturalUtilization * WAD) / (WAD - naturalUtilization));
      let x = -((sigmoidSpeed * (lnWad((uG * WAD) / (WAD - uG)) - auxSigmoid)) / WAD);
      const sigmoid = x > EXP_THRESHOLD ? 0n : (WAD * WAD) / (WAD + expWad(x));

      x = (-growthSpeed * lnWad(WAD - (sigmoid * uG) / WAD)) / WAD;
      const globalFactor = expWad(x > EXP_THRESHOLD ? EXP_THRESHOLD : x);

      if (globalFactor > MAX_UINT256 / r) {
        return maxRate;
      }

      const rate = (r * globalFactor) / WAD;
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
  fixedAllocation: bigint;
  maturitySpeed: bigint;
};

export function fixedRate(parameters: FixedParameters, uFixed: bigint, uFloating: bigint, uGlobal: bigint) {
  const { maxPools, spreadFactor, timePreference, maturitySpeed, fixedAllocation, maturity, timestamp } = parameters;
  const base = floatingInterestRateCurve(parameters)(uFloating, uGlobal);
  if (uFixed === 0n) return base;

  const sqAlpha = (maxPools * WAD * WAD) / fixedAllocation;
  const alpha = sqrtWad(sqAlpha * WAD);
  const sqX = (maxPools * uFixed * WAD * WAD) / (uGlobal * fixedAllocation);
  const x = sqrtWad(sqX * WAD);
  const a = ((2n * WAD - sqAlpha) * WAD) / ((alpha * (WAD - alpha)) / WAD);
  const z = (a * x) / WAD + ((WAD - a) * sqX) / WAD - WAD;

  const time = timestamp !== undefined ? timestamp : BigInt(Math.floor(Date.now() / 1000));
  if (time >= maturity) throw new Error('Already matured');

  const ttm = maturity - time;
  const interval = 4n * 7n * 24n * 60n * 60n;
  const ttMaxM = time + maxPools * interval - (time % interval);

  return {
    rate:
      (base *
        (WAD +
          (expWad((maturitySpeed * lnWad((ttm * WAD) / ttMaxM)) / WAD) * (timePreference + (spreadFactor * z) / WAD)) /
            WAD)) /
      WAD,
    z,
  };
}

export function spreadModel(parameters: Omit<FixedParameters, 'maturity'>, uFloating: bigint, uGlobal: bigint) {
  const time = parameters.timestamp ? parameters.timestamp : BigInt(Math.floor(Date.now() / 1000));

  return (maturity: bigint, z: bigint) => {
    const { maxPools, spreadFactor, timePreference, maturitySpeed } = parameters;
    const base = floatingInterestRateCurve(parameters)(uFloating, uGlobal);
    if (maturity === time) return base;

    const ttm = maturity - time;
    const interval = 4n * 7n * 24n * 60n * 60n;
    const ttMaxM = time + maxPools * interval - (time % interval);

    return (
      (base *
        (WAD +
          (expWad((maturitySpeed * lnWad((ttm * WAD) / ttMaxM)) / WAD) * (timePreference + (spreadFactor * z) / WAD)) /
            WAD)) /
      WAD
    );
  };
}

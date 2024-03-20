import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

const ONE_YEAR = 31_536_000n;

export function calculateAPR(fee: bigint, assets: bigint, timestamp: bigint, maturity: bigint): bigint {
  return ((fee * WAD * ONE_YEAR) / (assets * (maturity - timestamp))) * 100n;
}

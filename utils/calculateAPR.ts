import { WEI_PER_ETHER } from 'utils/const';

const ONE_YEAR = 31_536_000n;

export function calculateAPR(fee: bigint, assets: bigint, timestamp: bigint, maturity: bigint): bigint {
  return ((fee * WEI_PER_ETHER * ONE_YEAR) / (assets * (maturity - timestamp))) * 100n;
}

import { WEI_PER_ETHER } from 'utils/const';

const ONE_YEAR = 31_536_000n;

export function calculateAPR(fee: bigint, assets: bigint, timestamp: bigint, maturity: bigint): bigint {
  const transactionRate = (fee * WEI_PER_ETHER) / assets;
  const time = ONE_YEAR / (maturity - timestamp);
  return transactionRate * time * 100n;
}

import { GAS_LIMIT_MULTIPLIER, WEI_PER_ETHER } from './const';

export const gasLimit = (gas: bigint) => (gas * GAS_LIMIT_MULTIPLIER) / WEI_PER_ETHER;

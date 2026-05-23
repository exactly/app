import { WAD } from '@exactly/lib';
import { GAS_LIMIT_MULTIPLIER } from './const';

export const gasLimit = (gas: bigint) => (gas * GAS_LIMIT_MULTIPLIER) / WAD;

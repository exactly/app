import WAD from '@exactly/lib/esm/fixed-point-math/WAD';
import { GAS_LIMIT_MULTIPLIER } from './const';

export const gasLimit = (gas: bigint) => (gas * GAS_LIMIT_MULTIPLIER) / WAD;

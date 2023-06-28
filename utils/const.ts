import { parseUnits } from 'viem';

import numbers from 'config/numbers.json';

export const DEFAULT_AMOUNT = BigInt(numbers.defaultAmount);

export const ETH_ROUTER_SLIPPAGE = parseUnits(String(numbers.ethRouterSlippage), 18);

export const GAS_LIMIT_MULTIPLIER = parseUnits(String(numbers.gasLimitMultiplier), 18);

export const MAX_UINT256 = 2n ** 256n - 1n;

export const WEI_PER_ETHER = 1000000000000000000n;

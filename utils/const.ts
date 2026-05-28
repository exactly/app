import { parseUnits } from 'viem';

import numbers from 'config/numbers.json';

export const DEFAULT_AMOUNT = BigInt(numbers.defaultAmount);

export const ETH_ROUTER_SLIPPAGE = parseUnits(String(numbers.ethRouterSlippage), 18);

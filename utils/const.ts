import { BigNumber, parseFixed } from '@ethersproject/bignumber';

import numbers from 'config/numbers.json';

export const defaultAmount = BigNumber.from(numbers.defaultAmount);

export const gasLimitMultiplier = parseFixed(String(numbers.gasLimitMultiplier), 18);

export const ethRouterSlippage = parseFixed(String(1 + numbers.ethRouterSlippage), 18);

import { expect } from '@playwright/test';
import { parseUnits } from 'viem';
import type { Address, PublicClient } from 'viem';

import { erc20, type ERC20TokenSymbol, erc20Market } from '../utils/contracts';
import { CommonTest } from './types';

export default function ({ test, publicClient }: CommonTest & { publicClient: PublicClient }) {
  type AllowanceParams = {
    address: Address;
    type: 'erc20' | 'market';
    symbol: ERC20TokenSymbol;
    spender: Address;
    less: string;
  };

  const check = async ({ address, type, symbol, spender, less: _less }: AllowanceParams) => {
    await test.step(`checks ${spender} allowance to be less than ${_less}`, async () => {
      let decimals = 18;
      let allowance = 2n ** 256n - 1n;

      switch (type) {
        case 'erc20': {
          const contract = await erc20(symbol, { publicClient });
          allowance = await contract.read.allowance([address, spender]);
          decimals = await contract.read.decimals();
          break;
        }
        case 'market': {
          const market = await erc20Market(symbol, { publicClient });
          allowance = await market.read.allowance([address, spender]);
          decimals = await market.read.decimals();
        }
      }

      const less = parseUnits(_less, decimals);
      expect(allowance).toBeLessThanOrEqual(less);
    });
  };

  return { check };
}

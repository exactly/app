import { expect } from '@playwright/test';
import { parseUnits } from 'viem';
import type { Address, PublicClient } from 'viem';

import { erc20, type ERC20TokenSymbol } from '../utils/contracts';
import { CommonTest } from './types';

export default function ({ test, publicClient }: CommonTest & { publicClient: PublicClient }) {
  type BalanceParams = {
    address: Address;
    symbol: ERC20TokenSymbol;
    amount: string;
    delta?: number;
  };

  const check = async ({ address, symbol, amount, delta }: BalanceParams) => {
    await test.step(`checks ${symbol} balance to be ${delta ? 'near ' : ''}${amount}`, async () => {
      const erc20Contract = await erc20(symbol, { publicClient });
      const balance = await erc20Contract.read.balanceOf([address]);
      const decimals = await erc20Contract.read.decimals();
      const expected = parseUnits(amount, decimals);
      if (delta) {
        const wad = parseUnits('1', decimals);
        const lower = (expected * parseUnits(String(1 - delta), decimals)) / wad;
        const upper = (expected * parseUnits(String(1 + delta), decimals)) / wad;

        expect(balance > lower).toBe(true);
        expect(balance < upper).toBe(true);
      } else {
        expect(balance).toBe(expected);
      }
    });
  };

  return { check };
}

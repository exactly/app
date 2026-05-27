import { expect } from '@playwright/test';
import { parseUnits } from 'viem';
import type { Address, PublicClient } from 'viem';

import { erc20, type ERC20TokenSymbol } from '../utils/contracts';
import type { CommonTest } from './types';

export default function ({ test, publicClient }: CommonTest & { publicClient: PublicClient }) {
  type BalanceParams = {
    address: Address;
    symbol: ERC20TokenSymbol;
    amount: string;
    delta?: string;
  };

  const check = async ({ address, symbol, amount, delta: _delta }: BalanceParams) => {
    await test.step(`assert: balance ${symbol} ${_delta ? '~=' : '='} ${amount}`, async () => {
      const erc20Contract = await erc20(symbol, { publicClient });
      const decimals = await erc20Contract.read.decimals();
      const expected = parseUnits(amount, decimals);
      await expect(async () => {
        const balance = await erc20Contract.read.balanceOf([address]);
        if (_delta) {
          const wad = parseUnits('1', decimals);
          const delta = parseUnits(_delta, decimals);
          const lower = (expected * (wad - delta)) / wad;
          const upper = (expected * (wad + delta)) / wad;

          expect(balance).toBeGreaterThan(lower);
          expect(balance).toBeLessThan(upper);
        } else {
          expect(balance).toBe(expected);
        }
      }).toPass({ timeout: 10_000 });
    });
  };

  const exists = async ({ address, symbol }: Pick<BalanceParams, 'address' | 'symbol'>) => {
    await test.step(`assert: balance ${symbol} > 0`, async () => {
      const erc20Contract = await erc20(symbol, { publicClient });
      await expect(async () => {
        expect(await erc20Contract.read.balanceOf([address])).toBeGreaterThan(0n);
      }).toPass({ timeout: 10_000 });
    });
  };

  return { check, exists };
}

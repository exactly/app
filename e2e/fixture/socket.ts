import { type Page } from '@playwright/test';
import { type Address } from 'viem';

import { chain } from './base';

function socket(page: Page) {
  const assets = {
    ETH: {
      chainId: chain.id,
      address: '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee',
      name: 'Ethereum',
      symbol: 'ETH',
      decimals: 18,
      chainAgnosticId: null,
      icon: 'https://maticnetwork.github.io/polygon-token-assets/assets/eth.svg',
      logoURI: 'https://maticnetwork.github.io/polygon-token-assets/assets/eth.svg',
    },
    OP: {
      chainId: chain.id,
      address: '0x4200000000000000000000000000000000000042',
      name: 'Optimism',
      symbol: 'OP',
      decimals: 18,
      chainAgnosticId: null,
      icon: 'https://optimistic.etherscan.io/token/images/optimism_32.png',
      logoURI: 'https://optimistic.etherscan.io/token/images/optimism_32.png',
    },
  };

  type Balance = {
    account: Address;
    balances: {
      symbol: 'ETH' | 'OP';
      amount: number;
    }[];
  };

  const balances = async (params: Balance) => {
    await page.route(/api\.socket\.tech\/v2\/balances/, async (route) => {
      const json = {
        success: true,
        result: params.balances.map(({ symbol, amount }) => ({ ...assets[symbol], amount })),
      };
      await route.fulfill({ json });
    });
  };

  return {
    balances,
  };
}

export type Socket = ReturnType<typeof socket>;

export default socket;

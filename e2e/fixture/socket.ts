import { createRequire } from 'node:module';

import { test, type Page } from '@playwright/test';
import { type Address } from 'viem';
import { anvil as chain } from 'viem/chains';

const require = createRequire(import.meta.url);
const exaContract = require('../deployments/anvil/EXA.json') as { address: Address };
const opContract = require('../deployments/anvil/OP.json') as { address: Address };
const swapperContract = require('../deployments/anvil/Swapper.json') as { address: Address };

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
      address: opContract.address,
      name: 'Optimism',
      symbol: 'OP',
      decimals: 18,
      chainAgnosticId: null,
      icon: 'https://optimistic.etherscan.io/token/images/optimism_32.png',
      logoURI: 'https://optimistic.etherscan.io/token/images/optimism_32.png',
    },
  };
  const exa = {
    chainId: chain.id,
    address: exaContract.address,
    name: 'exactly',
    symbol: 'EXA',
    decimals: 18,
    chainAgnosticId: null,
    icon: '/img/assets/EXA.svg',
    logoURI: '/img/assets/EXA.svg',
  };
  const protocol = {
    icon: 'https://socket.tech/favicon.ico',
    name: 'socket',
    displayName: 'Socket',
  };

  void page.route(/api\.socket\.tech\/v2\/supported\/chains/, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        result: [
          {
            chainId: chain.id,
            name: 'Optimism',
            isL1: false,
            sendingEnabled: true,
            icon: '/img/networks/optimism.svg',
            receivingEnabled: true,
            rpcs: [],
            explorers: [],
          },
        ],
      },
    });
  });

  void page.route(/api\.socket\.tech\/v2\/quote/, async (route) => {
    const url = new URL(route.request().url());
    const fromAmount = BigInt(url.searchParams.get('fromAmount') ?? 0);
    const fromTokenAddress = url.searchParams.get('fromTokenAddress') as Address;
    const userAddress = url.searchParams.get('userAddress') as Address;
    await route.fulfill({
      json: {
        success: true,
        result: {
          routes: [
            {
              routeId: 'local-swap',
              isOnlySwapRoute: true,
              fromAmount: fromAmount.toString(),
              toAmount: fromAmount.toString(),
              sender: userAddress,
              recipient: userAddress,
              totalUserTx: 1,
              totalGasFeesInUsd: 0,
              userTxs: [
                {
                  sender: userAddress,
                  txType: 'swap',
                  chainId: chain.id,
                  gasFees: { asset: assets.ETH, gasLimit: 0, feesInUsd: 0, gasAmount: 0 },
                  toAsset: exa,
                  toAmount: Number(fromAmount),
                  recipient: userAddress,
                  userTxType: 'fund-movr',
                  serviceTime: 60,
                  userTxIndex: 0,
                  approvalData: null,
                  sourceTransactionHash: '',
                  sourceTransactionReceipt: {},
                  protocol,
                  fromAsset: { ...assets.OP, address: fromTokenAddress },
                  fromAmount: Number(fromAmount),
                },
              ],
              usedDexName: 'Local',
              integratorFee: { asset: exa, amount: 0 },
              outputValueInUsd: 0,
              receivedValueInUsd: 0,
              inputValueInUsd: 0,
            },
          ],
          destinationCallData: { destinationPayload: '0x', destinationGasLimit: '0' },
        },
      },
    });
  });

  void page.route(/api\.socket\.tech\/v2\/build-tx/, async (route) => {
    await route.fulfill({
      json: { success: true, result: { txTarget: swapperContract.address, txData: '0x', value: '0' } },
    });
  });

  void page.route(/api\.socket\.tech\/v2\/route\/active-routes\/users/, async (route) => {
    await route.fulfill({ json: { success: true, result: { activeRoutes: [] } } });
  });

  void page.route(/api\.socket\.tech\/v2\/token-price/, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        result: { chainId: chain.id, tokenAddress: exa.address, tokenPrice: 1, decimals: 18, currency: 'USD' },
      },
    });
  });

  void page.route(/api\.socket\.tech\/v2\/bridge-status/, async (route) => {
    await route.fulfill({
      json: {
        success: true,
        result: {
          sourceTxStatus: 'COMPLETED',
          destinationTxStatus: 'COMPLETED',
          destinationTransactionHash: '',
          sourceTransactionHash: '0x0000000000000000000000000000000000000000000000000000000000000000',
        },
      },
    });
  });

  type Balance = {
    account: Address;
    balances: {
      symbol: 'ETH' | 'OP';
      amount: number;
    }[];
  };

  const balances = async (params: Balance) =>
    test.step('setup: socket balances', async () => {
      await page.route(/api\.socket\.tech\/v2\/balances/, async (route) => {
        const json = {
          success: true,
          result: params.balances.map(({ symbol, amount }) => ({ ...assets[symbol], amount })),
        };
        await route.fulfill({ json });
      });
    });

  return {
    balances,
  };
}

export type Socket = ReturnType<typeof socket>;

export default socket;

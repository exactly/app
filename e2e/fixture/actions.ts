import { test } from '@playwright/test';
import { parseEther, parseUnits, type Address, type PublicClient, type WalletClient } from 'viem';

import { erc20, erc20Market, ethRouter, auditor, type ERC20TokenSymbol, type Coin } from '../utils/contracts';

const MaxUint256 = 2n ** 256n - 1n;
const WeiPerEther = 10n ** 18n;

const options = (client: WalletClient) => {
  if (!client.account) throw new Error('Account is undefined');
  return { chain: client.chain, account: client.account };
};

type ActionParams = {
  publicClient: PublicClient;
  walletClient: WalletClient;
};

const actions = ({ publicClient, walletClient }: ActionParams) => {
  const enterMarket = async (symbol: ERC20TokenSymbol) =>
    test.step(`setup: enter market ${symbol}`, async () => {
      const auditorContract = await auditor({ walletClient });
      const erc20MarketContract = await erc20Market(symbol);
      await publicClient.waitForTransactionReceipt({
        hash: await auditorContract.write.enterMarket([erc20MarketContract.address], options(walletClient)),
      });
    });

  const exitMarket = async (symbol: ERC20TokenSymbol) =>
    test.step(`setup: exit market ${symbol}`, async () => {
      const auditorContract = await auditor({ walletClient });
      const erc20MarketContract = await erc20Market(symbol);
      await publicClient.waitForTransactionReceipt({
        hash: await auditorContract.write.exitMarket([erc20MarketContract.address], options(walletClient)),
      });
    });

  type FloatingOperationParams = {
    symbol: Coin;
    amount: string;
    receiver: Address;
  };

  const deposit = async ({ symbol, amount, receiver }: FloatingOperationParams) =>
    test.step(`setup: deposit ${amount} ${symbol}`, async () => {
      if (symbol === 'ETH') {
        const ethRouterContract = await ethRouter({ walletClient });
        await publicClient.waitForTransactionReceipt({
          hash: await ethRouterContract.write.deposit({ ...options(walletClient), value: parseEther(amount) }),
        });
      } else {
        const erc20Contract = await erc20(symbol, { walletClient, publicClient });
        const erc20MarketContract = await erc20Market(symbol, { walletClient });
        const qty = parseUnits(amount, await erc20Contract.read.decimals());
        await publicClient.waitForTransactionReceipt({
          hash: await erc20Contract.write.approve([erc20MarketContract.address, MaxUint256], options(walletClient)),
        });
        await publicClient.waitForTransactionReceipt({
          hash: await erc20MarketContract.write.deposit([qty, receiver], options(walletClient)),
        });
      }
    });

  const borrow = async ({ symbol, amount, receiver }: FloatingOperationParams) =>
    test.step(`setup: borrow ${amount} ${symbol}`, async () => {
      if (symbol === 'ETH') {
        const wethMarketContract = await erc20Market('WETH', { walletClient });
        const ethRouterContract = await ethRouter({ walletClient });
        await publicClient.waitForTransactionReceipt({
          hash: await wethMarketContract.write.approve([ethRouterContract.address, MaxUint256], options(walletClient)),
        });
        await publicClient.waitForTransactionReceipt({
          hash: await ethRouterContract.write.borrow([parseEther(amount)], options(walletClient)),
        });
      } else {
        const erc20Contract = await erc20(symbol, { publicClient });
        const erc20MarketContract = await erc20Market(symbol, { walletClient });
        const qty = parseUnits(amount, await erc20Contract.read.decimals());
        await publicClient.waitForTransactionReceipt({
          hash: await erc20MarketContract.write.borrow([qty, receiver, receiver], options(walletClient)),
        });
      }
    });

  type FixedOperationParams = {
    symbol: Coin;
    amount: string;
    maturity: bigint;
    receiver: Address;
  };

  const minAssets = (quantity: bigint) => (quantity * parseEther('0.98')) / WeiPerEther;
  const maxAssets = (quantity: bigint) => (quantity * parseEther('1.02')) / WeiPerEther;

  const depositAtMaturity = async ({ symbol, amount, maturity, receiver }: FixedOperationParams) =>
    test.step(`setup: deposit ${amount} ${symbol} fixed`, async () => {
      if (symbol === 'ETH') {
        const ethRouterContract = await ethRouter({ walletClient });
        const qty = parseEther(amount);
        await publicClient.waitForTransactionReceipt({
          hash: await ethRouterContract.write.depositAtMaturity([maturity, minAssets(qty)], {
            ...options(walletClient),
            value: qty,
          }),
        });
      } else {
        const erc20Contract = await erc20(symbol, { walletClient, publicClient });
        const erc20MarketContract = await erc20Market(symbol, { walletClient });
        const qty = parseUnits(amount, await erc20Contract.read.decimals());
        await publicClient.waitForTransactionReceipt({
          hash: await erc20Contract.write.approve([erc20MarketContract.address, MaxUint256], options(walletClient)),
        });
        await publicClient.waitForTransactionReceipt({
          hash: await erc20MarketContract.write.depositAtMaturity(
            [maturity, qty, minAssets(qty), receiver],
            options(walletClient),
          ),
        });
      }
    });

  const borrowAtMaturity = async ({ symbol, amount, maturity, receiver }: FixedOperationParams) =>
    test.step(`setup: borrow ${amount} ${symbol} fixed`, async () => {
      if (symbol === 'ETH') {
        const wethMarketContract = await erc20Market('WETH', { walletClient });
        const ethRouterContract = await ethRouter({ walletClient });
        const qty = parseEther(amount);
        await publicClient.waitForTransactionReceipt({
          hash: await wethMarketContract.write.approve([ethRouterContract.address, MaxUint256], options(walletClient)),
        });
        await publicClient.waitForTransactionReceipt({
          hash: await ethRouterContract.write.borrowAtMaturity([maturity, qty, maxAssets(qty)], options(walletClient)),
        });
      } else {
        const erc20Contract = await erc20(symbol, { publicClient });
        const erc20MarketContract = await erc20Market(symbol, { walletClient });
        const qty = parseUnits(amount, await erc20Contract.read.decimals());
        await publicClient.waitForTransactionReceipt({
          hash: await erc20MarketContract.write.borrowAtMaturity(
            [maturity, qty, maxAssets(qty), receiver, receiver],
            options(walletClient),
          ),
        });
      }
    });

  return { enterMarket, exitMarket, deposit, borrow, depositAtMaturity, borrowAtMaturity };
};

export type Actions = ReturnType<typeof actions>;

export default actions;

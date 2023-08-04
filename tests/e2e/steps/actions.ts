import dayjs from 'dayjs';
import { Address, parseEther, parseUnits } from 'viem';
import type { PublicClient, WalletClient } from 'viem';

import { erc20, erc20Market, ethRouter, auditor, ERC20TokenSymbol, Coin } from '../utils/contracts';
import type { Defer } from '../utils/types';

const MaxUint256 = 2n ** 256n - 1n;
const WeiPerEther = 10n ** 18n;

const options = (client: WalletClient) => {
  if (!client.account) {
    throw new Error('Account is undefined');
  }
  return { chain: client.chain, account: client.account };
};

export const enterMarket = (symbol: ERC20TokenSymbol, walletClient: Defer<WalletClient>) => {
  it(`enter market for ${symbol}`, async () => {
    const client = walletClient();
    const auditorContract = await auditor({ walletClient: client });
    const erc20MarketContract = await erc20Market(symbol);
    if (!client.account) return;
    const args = [erc20MarketContract.address] as const;
    const gas = await auditorContract.estimateGas.enterMarket(args, options(client));
    await auditorContract.write.enterMarket(args, { ...options(client), gasLimit: gas * 2n });
  });
};

export const exitMarket = (symbol: ERC20TokenSymbol, walletClient: Defer<WalletClient>) => {
  it(`exit market for ${symbol}`, async () => {
    const client = walletClient();
    const auditorContract = await auditor({ walletClient: client });
    const erc20MarketContract = await erc20Market(symbol);
    const args = [erc20MarketContract.address] as const;
    const gas = await auditorContract.estimateGas.exitMarket(args, options(client));
    await auditorContract.write.exitMarket(args, { ...options(client), gasLimit: gas * 2n });
  });
};

type FloatingOperationParams = {
  symbol: Coin;
  amount: string;
  receiver: Address;
};

export const deposit = (
  { symbol, amount, receiver }: FloatingOperationParams,
  walletClient: Defer<WalletClient>,
  publicClient: Defer<PublicClient>,
) => {
  it(`deposit ${amount} ${symbol} to floating pool`, async () => {
    const wClient = walletClient();
    const pClient = publicClient();
    if (symbol === 'ETH') {
      const ethRouterContract = await ethRouter({ walletClient: wClient });
      const qty = parseEther(amount);
      const args = { value: qty };
      const gas = await ethRouterContract.estimateGas.deposit({ ...options(wClient), ...args });
      await ethRouterContract.write.deposit({
        ...options(wClient),
        ...args,
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { walletClient: wClient, publicClient: pClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient: wClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const approveArgs = [erc20MarketContract.address, MaxUint256] as const;
      const approveGas = await erc20Contract.estimateGas.approve(approveArgs, options(wClient));
      await erc20Contract.write.approve(approveArgs, {
        ...options(wClient),
        gasLimit: approveGas * 2n,
      });
      const args = [qty, receiver] as const;
      const gas = await erc20MarketContract.estimateGas.deposit(args, options(wClient));
      await erc20MarketContract.write.deposit(args, {
        ...options(wClient),
        gasLimit: gas * 2n,
      });
    }
  });
};

export const borrow = (
  { symbol, amount, receiver }: FloatingOperationParams,
  walletClient: Defer<WalletClient>,
  publicClient: Defer<PublicClient>,
) => {
  it(`borrow ${amount} ${symbol} from floating pool`, async () => {
    const wClient = walletClient();
    const pClient = publicClient();
    if (symbol === 'ETH') {
      const wethMarketContract = await erc20Market('WETH', { walletClient: wClient });
      const ethRouterContract = await ethRouter({ walletClient: wClient });
      const qty = parseEther(amount);
      const approveArgs = [ethRouterContract.address, MaxUint256] as const;
      const approveGas = await wethMarketContract.estimateGas.approve(approveArgs, options(wClient));
      await wethMarketContract.write.approve(approveArgs, {
        ...options(wClient),
        gasLimit: approveGas * 2n,
      });
      const args = [qty] as const;
      const gas = await ethRouterContract.estimateGas.borrow(args, options(wClient));
      await ethRouterContract.write.borrow(args, {
        ...options(wClient),
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { publicClient: pClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient: wClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const args = [qty, receiver, receiver] as const;
      const gas = await erc20MarketContract.estimateGas.borrow(args, options(wClient));
      await erc20MarketContract.write.borrow(args, {
        ...options(wClient),
        gasLimit: gas * 2n,
      });
    }
  });
};

type FixedOperationParams = {
  symbol: Coin;
  amount: string;
  maturity: bigint;
  receiver: Address;
};

const formatDate = (timestamp: number) => dayjs.unix(timestamp).format('YYYY-MM-DD');
const minAssets = (quantity: bigint) => (quantity * parseEther('0.98')) / WeiPerEther;
const maxAssets = (quantity: bigint) => (quantity * parseEther('1.02')) / WeiPerEther;

export const depositAtMaturity = (
  { symbol, amount, maturity, receiver }: FixedOperationParams,
  walletClient: Defer<WalletClient>,
  publicClient: Defer<PublicClient>,
) => {
  it(`deposit ${amount} ${symbol} to fixed pool with maturity ${formatDate(Number(maturity))}`, async () => {
    const wClient = walletClient();
    const pClient = publicClient();
    if (symbol === 'ETH') {
      const ethRouterContract = await ethRouter({ walletClient: wClient });
      const qty = parseEther(amount);
      const args = [maturity, minAssets(qty)] as const;
      const gas = await ethRouterContract.estimateGas.depositAtMaturity(args, { ...options(wClient), value: qty });
      await ethRouterContract.write.depositAtMaturity(args, {
        ...options(wClient),
        value: qty,
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { walletClient: wClient, publicClient: pClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient: wClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const approveArgs = [erc20MarketContract.address, MaxUint256] as const;
      const approveGas = await erc20Contract.estimateGas.approve(approveArgs, options(wClient));
      await erc20Contract.write.approve(approveArgs, {
        ...options(wClient),
        gasLimit: approveGas * 2n,
      });
      const args = [maturity, qty, minAssets(qty), receiver] as const;
      const gas = await erc20MarketContract.estimateGas.depositAtMaturity(args, options(wClient));
      await erc20MarketContract.write.depositAtMaturity(args, {
        ...options(wClient),
        gasLimit: gas * 2n,
      });
    }
  });
};

export const borrowAtMaturity = (
  { symbol, amount, maturity, receiver }: FixedOperationParams,
  walletClient: Defer<WalletClient>,
  publicClient: Defer<PublicClient>,
) => {
  it(`borrow ${amount} ${symbol} from fixed pool with maturity ${formatDate(Number(maturity))}`, async () => {
    const wClient = walletClient();
    const pClient = publicClient();
    if (symbol === 'ETH') {
      const wethMarketContract = await erc20Market('WETH', { walletClient: wClient });
      const ethRouterContract = await ethRouter({ walletClient: wClient });
      const qty = parseEther(amount);
      const approveArgs = [ethRouterContract.address, MaxUint256] as const;
      const approveGas = await wethMarketContract.estimateGas.approve(approveArgs, options(wClient));
      await wethMarketContract.write.approve(approveArgs, {
        ...options(wClient),
        gasLimit: approveGas * 2n,
      });
      const args = [maturity, qty, maxAssets(qty)] as const;
      const gas = await ethRouterContract.estimateGas.borrowAtMaturity(args, options(wClient));
      await ethRouterContract.write.borrowAtMaturity(args, {
        ...options(wClient),
        gasLimit: gas * 2n,
      });
    } else {
      const erc20Contract = await erc20(symbol, { publicClient: pClient });
      const erc20MarketContract = await erc20Market(symbol, { walletClient: wClient });
      const qty = parseUnits(amount, await erc20Contract.read.decimals());
      const args = [maturity, qty, maxAssets(qty), receiver, receiver] as const;
      const gas = await erc20MarketContract.estimateGas.borrowAtMaturity(args, options(wClient));
      await erc20MarketContract.write.borrowAtMaturity(args, {
        ...options(wClient),
        gasLimit: gas * 2n,
      });
    }
  });
};

type BalanceParams = {
  address: Address;
  symbol: ERC20TokenSymbol;
  amount: string;
  delta?: number;
};

export const checkBalance = ({ address, symbol, amount, delta }: BalanceParams, publicClient: Defer<PublicClient>) => {
  it(`checks ${symbol} balance to be ${delta ? 'near ' : ''}${amount}`, async () => {
    const client = publicClient();
    const erc20Contract = await erc20(symbol, { publicClient: client });
    const balance = await erc20Contract.read.balanceOf([address]);
    const decimals = await erc20Contract.read.decimals();
    const expected = parseUnits(amount, decimals);
    if (delta) {
      const wad = parseUnits('1', decimals);
      const lower = (expected * parseUnits(String(1 - delta), decimals)) / wad;
      const upper = (expected * parseUnits(String(1 + delta), decimals)) / wad;

      // eslint-disable-next-line chai-expect/no-inner-compare
      expect(balance > lower).to.eq(true);
      // eslint-disable-next-line chai-expect/no-inner-compare
      expect(balance < upper).to.eq(true);
    } else {
      expect(balance).to.eq(expected);
    }
  });
};

export const reload = async () => {
  it('reloads the app', () => {
    cy.reload();
    justWait(1000);
    cy.reload();
    justWait();
  });
};

export const justWait = (timeout = 5000) => {
  return cy.wait(timeout);
};

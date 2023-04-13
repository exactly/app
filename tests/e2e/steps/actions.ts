import dayjs from 'dayjs';
import { Signer } from '@ethersproject/abstract-signer';
import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { MaxUint256, WeiPerEther } from '@ethersproject/constants';

import { erc20, erc20Market, ethRouter, auditor, ERC20TokenSymbol, Coin } from '../utils/contracts';
import type { Defer } from '../utils/types';

export const enterMarket = (symbol: ERC20TokenSymbol, signer: Defer<Signer>) => {
  it(`enter market for ${symbol}`, async () => {
    const auditorContract = auditor(signer());
    const erc20MarketContract = await erc20Market(symbol);
    await auditorContract.enterMarket(erc20MarketContract.address);
  });
};

export const exitMarket = (symbol: ERC20TokenSymbol, signer: Defer<Signer>) => {
  it(`exit market for ${symbol}`, async () => {
    const auditorContract = auditor(signer());
    const erc20MarketContract = await erc20Market(symbol);
    await auditorContract.exitMarket(erc20MarketContract.address);
  });
};

type FloatingOperationParams = {
  symbol: Coin;
  amount: string;
  receiver: string;
};

export const deposit = ({ symbol, amount, receiver }: FloatingOperationParams, signer: Defer<Signer>) => {
  it(`deposit ${amount} ${symbol} to floating pool`, async () => {
    if (symbol === 'ETH') {
      const weth = await erc20('WETH', signer());
      const ethRouterContract = ethRouter(signer());
      const qty = parseFixed(amount, await weth.decimals());
      await ethRouterContract.deposit({ value: qty });
    } else {
      const erc20Contract = await erc20(symbol, signer());
      const erc20MarketContract = await erc20Market(symbol, signer());
      const qty = parseFixed(amount, await erc20Contract.decimals());
      await erc20Contract.approve(erc20MarketContract.address, MaxUint256);
      await erc20MarketContract.deposit(qty, receiver);
    }
  });
};

export const borrow = ({ symbol, amount, receiver }: FloatingOperationParams, signer: Defer<Signer>) => {
  it(`borrow ${amount} ${symbol} from floating pool`, async () => {
    if (symbol === 'ETH') {
      const weth = await erc20('WETH', signer());
      const wethMarketContract = await erc20Market('WETH', signer());
      const ethRouterContract = ethRouter(signer());
      const qty = parseFixed(amount, await weth.decimals());
      await wethMarketContract.approve(ethRouterContract.address, MaxUint256);
      await ethRouterContract.borrow(qty);
    } else {
      const erc20Contract = await erc20(symbol, signer());
      const erc20MarketContract = await erc20Market(symbol, signer());
      const qty = parseFixed(amount, await erc20Contract.decimals());
      await erc20MarketContract.borrow(qty, receiver, receiver);
    }
  });
};

type FixedOperationParams = {
  symbol: Coin;
  amount: string;
  maturity: number;
  receiver: string;
};

const delta = 0.02;
const formatDate = (timestamp: number) => dayjs.unix(timestamp).format('YYYY-MM-DD');

export const depositAtMaturity = (
  { symbol, amount, maturity, receiver }: FixedOperationParams,
  signer: Defer<Signer>,
) => {
  const minAssets = (quantity: BigNumber) => quantity.mul(parseFixed(String(1 - delta), 18)).div(WeiPerEther);

  it(`deposit ${amount} ${symbol} to fixed pool with maturity ${formatDate(maturity)}`, async () => {
    if (symbol === 'ETH') {
      const weth = await erc20('WETH', signer());
      const ethRouterContract = ethRouter(signer());
      const qty = parseFixed(amount, await weth.decimals());
      await ethRouterContract.depositAtMaturity(maturity, minAssets(qty), { value: qty });
    } else {
      const erc20Contract = await erc20(symbol, signer());
      const erc20MarketContract = await erc20Market(symbol, signer());
      const qty = parseFixed(amount, await erc20Contract.decimals());
      await erc20Contract.approve(erc20MarketContract.address, MaxUint256);
      await erc20MarketContract.depositAtMaturity(maturity, qty, minAssets(qty), receiver);
    }
  });
};

export const borrowAtMaturity = (
  { symbol, amount, maturity, receiver }: FixedOperationParams,
  signer: Defer<Signer>,
) => {
  const maxAssets = (quantity: BigNumber) => quantity.mul(parseFixed(String(1 + delta), 18)).div(WeiPerEther);

  it(`borrow ${amount} ${symbol} from fixed pool with maturity ${formatDate(maturity)}`, async () => {
    if (symbol === 'ETH') {
      const weth = await erc20('WETH', signer());
      const wethMarketContract = await erc20Market('WETH', signer());
      const ethRouterContract = ethRouter(signer());
      const qty = parseFixed(amount, await weth.decimals());
      await wethMarketContract.approve(ethRouterContract.address, MaxUint256);
      await ethRouterContract.borrowAtMaturity(maturity, qty, maxAssets(qty));
    } else {
      const erc20Contract = await erc20(symbol, signer());
      const erc20MarketContract = await erc20Market(symbol, signer());
      const qty = parseFixed(amount, await erc20Contract.decimals());
      await erc20MarketContract.borrowAtMaturity(maturity, qty, maxAssets(qty), receiver, receiver);
    }
  });
};

type BalanceParams = {
  symbol: ERC20TokenSymbol;
  amount: string;
  approx?: number;
};

export const checkBalance = ({ symbol, amount, approx }: BalanceParams, signer: Defer<Signer>) => {
  it(`checks ${symbol} balance to be ${approx ? 'near ' : ''}${amount}`, async () => {
    const erc20Contract = await erc20(symbol, signer());
    const balance = await erc20Contract.balanceOf(await signer().getAddress());
    const decimals = await erc20Contract.decimals();
    if (approx) {
      const wad = parseFixed('1', decimals);
      const parsed = parseFixed(amount, decimals);
      const lower = parsed.mul(parseFixed(String(1 - approx), decimals)).div(wad);
      const upper = parsed.mul(parseFixed(String(1 + approx), decimals)).div(wad);

      expect(balance.gt(lower)).to.eq(true);
      expect(balance.lt(upper)).to.eq(true);
    } else {
      const expectedBalance = parseFixed(amount, decimals);
      expect(balance.toString()).to.eq(expectedBalance.toString());
    }
  });
};

export const reload = async () => {
  it('reloads the app', () => {
    cy.reload();
    justWait();
  });
};

export const justWait = () => {
  // eslint-disable-next-line cypress/no-unnecessary-waiting, ui-testing/no-hard-wait
  return cy.wait(4000);
};

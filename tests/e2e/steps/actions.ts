import { Signer } from '@ethersproject/abstract-signer';
import { parseFixed } from '@ethersproject/bignumber';

import { erc20, erc20Market, ethRouter, auditor, ERC20TokenSymbol, Coin } from '../utils/contracts';
import type { Defer } from '../utils/types';

export const enterMarket = (symbol: ERC20TokenSymbol, signer: Defer<Signer>) => {
  it(`enters market for ${symbol}`, async () => {
    const auditorContract = auditor(signer());
    const erc20MarketContract = await erc20Market(symbol);
    await auditorContract.enterMarket(erc20MarketContract.address);
  });
};

export const exitMarket = (symbol: ERC20TokenSymbol, signer: Defer<Signer>) => {
  it(`exits market for ${symbol}`, async () => {
    const auditorContract = auditor(signer());
    const erc20MarketContract = await erc20Market(symbol);
    await auditorContract.exitMarket(erc20MarketContract.address);
  });
};

type DepositParams = {
  symbol: Coin;
  amount: string;
  receiver: string;
};

export const deposit = ({ symbol, amount, receiver }: DepositParams, signer: Defer<Signer>) => {
  it(`deposits ${amount} ${symbol} to floating pool`, async () => {
    if (symbol === 'ETH') {
      const weth = await erc20('WETH', signer());
      const ethRouterContract = ethRouter(signer());
      const qty = parseFixed(amount, await weth.decimals());
      await ethRouterContract.deposit({ value: qty });
    } else {
      const erc20Contract = await erc20(symbol, signer());
      const erc20MarketContract = await erc20Market(symbol, signer());
      const qty = parseFixed(amount, await erc20Contract.decimals());
      await erc20Contract.approve(erc20MarketContract.address, qty);
      await erc20MarketContract.deposit(qty, receiver);
    }
  });
};

export const borrow = ({ symbol, amount, receiver }: DepositParams, signer: Defer<Signer>) => {
  it(`borrows ${amount} ${symbol} to floating pool`, async () => {
    if (symbol === 'ETH') {
      const weth = await erc20('WETH', signer());
      const wethMarketContract = await erc20Market('WETH', signer());
      const ethRouterContract = ethRouter(signer());
      const qty = parseFixed(amount, await weth.decimals());
      await wethMarketContract.approve(ethRouterContract.address, qty);
      await ethRouterContract.borrow(qty);
    } else {
      const erc20Contract = await erc20(symbol, signer());
      const erc20MarketContract = await erc20Market(symbol, signer());
      const qty = parseFixed(amount, await erc20Contract.decimals());
      await erc20MarketContract.borrow(qty, receiver, receiver);
    }
  });
};

export const reload = async () => {
  it('reloads the app', () => {
    cy.reload();
    // eslint-disable-next-line cypress/no-unnecessary-waiting, ui-testing/no-hard-wait, testing-library/await-async-utils
    cy.wait(5000);
  });
};

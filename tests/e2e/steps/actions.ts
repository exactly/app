import { Coin } from '../utils/tenderly';
import { pastParticiple } from '../utils/strings';
import * as modal from './modal';
import * as dashboard from './dashboard';
import type { Operation } from './modal';

type OperationParams = {
  type: 'floating' | 'fixed';
  action: Operation;
  symbol: Coin;
  amount: string;
};

const executeOperation = ({ type, action, symbol, amount }: OperationParams) => {
  modal.open(type, action, symbol);
  modal.waitForSubmit();

  modal.input(amount);
  modal.waitForSubmit();

  modal.approveIfRequired();

  modal.submit();
  modal.waitForTransaction(action);

  modal.checkTransactionStatus('success', `You ${pastParticiple(action)} ${amount} ${symbol}`);

  modal.close();
};

export const deposit = (params: Omit<OperationParams, 'action'>) => {
  executeOperation({ action: 'deposit', ...params });
};

type MarketParams = {
  symbol: Coin;
};

export const enterMarket = ({ symbol }: MarketParams) => {
  symbol = symbol === 'ETH' ? 'WETH' : symbol;

  dashboard.attemptEnterMarket(symbol);
  dashboard.waitForTransaction(symbol);
};

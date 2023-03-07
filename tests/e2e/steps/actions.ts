import { Coin } from '../utils/tenderly';
import { pastParticiple } from '../utils/strings';
import * as Modal from './modal';
import * as Dashboard from './dashboard';
import type { Operation } from './modal';

type OperationParams = {
  type: 'floating' | 'fixed';
  action: Operation;
  symbol: Coin;
  amount: string;
};

const executeOperation = ({ type, action, symbol, amount }: OperationParams) => {
  Modal.open(type, action, symbol);
  Modal.waitForSubmit();

  Modal.input(amount);
  Modal.waitForSubmit();

  Modal.approveIfRequired();

  Modal.submit();
  Modal.waitForTransaction(action);

  Modal.checkTransactionStatus('success', `You ${pastParticiple(action)} ${amount} ${symbol}`);

  Modal.close();
};

export const deposit = (params: Omit<OperationParams, 'action'>) => {
  executeOperation({ action: 'deposit', ...params });
};

type MarketParams = {
  symbol: Coin;
};

export const enterMarket = ({ symbol }: MarketParams) => {
  symbol = symbol === 'ETH' ? 'WETH' : symbol;

  Dashboard.attemptEnterMarket(symbol);
  Dashboard.waitForTransaction(symbol);
};

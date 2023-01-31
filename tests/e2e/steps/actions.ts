import { Coin } from '../utils/tenderly';
import { pastParticiple, capitalize } from '../utils/strings';
import * as Modal from './modal';
import type { Operation } from './modal';

type Params = {
  type: 'floating' | 'fixed';
  action: Operation;
  symbol: Coin;
  amount: string;
};

const executeOperation = ({ type, action, symbol, amount }: Params) => {
  Modal.open(type, action, symbol);

  Modal.input(amount);
  Modal.waitForSubmit();

  Modal.approveIfRequired();

  Modal.submit();
  Modal.waitForTransaction(action);

  Modal.checkTransactionStatus('success', `${capitalize(pastParticiple(action))} ${amount} ${symbol}`);

  Modal.close();
};

export const deposit = (params: Omit<Params, 'action'>) => {
  executeOperation({ action: 'deposit', ...params });
};

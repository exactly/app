import * as Modal from '../modal';
import { repeat } from '../../utils/strings';
import { Coin } from '../../utils/tenderly';

type TestParams = {
  type: 'floating' | 'fixed';
  symbol: Coin;
  decimals: number;
  balance: string;
  amount?: string;
  shouldApprove?: boolean;
};

export default ({ type, symbol, decimals, balance, amount = '1', shouldApprove = false }: TestParams) => {
  describe(`${symbol} ${type} deposit`, () => {
    it('should open the modal', () => {
      Modal.open(type, 'deposit', symbol);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        Modal.checkTitle('Deposit');
        Modal.checkType(type);
        Modal.checkAssetSelection(symbol);
        Modal.checkWalletBalance(balance);
      });
    });

    describe('the input', () => {
      afterEach(() => {
        Modal.clearInput();
      });

      it('should not allow to input more decimals than the allowed', () => {
        const inp = `0.${repeat(decimals + 1, '1')}`;
        Modal.input(inp);
        Modal.checkInput(inp.slice(0, inp.length - 1));
      });

      it('should warn if the user tries to deposit more than its current balance', () => {
        const aboveBalance = Number(balance) + 1;
        Modal.input(String(aboveBalance));
        Modal.checkAlert('error', "You can't deposit more than you have in your wallet");
      });

      it('should input the wallet balance on max', () => {
        Modal.onMax();
        Modal.checkInput(balance);
      });

      it(`should allow to input the amount ${amount}`, () => {
        Modal.input(amount);
        Modal.checkAlertNotFound('error');
      });
    });

    describe('the transaction', () => {
      it('should be successful', () => {
        Modal.input(amount);

        if (shouldApprove) {
          Modal.waitForApprove();
          Modal.approve();
        }

        Modal.waitForSubmit();

        Modal.submit();
        Modal.waitForTransaction('deposit');

        Modal.checkTransactionStatus('success', `Deposited ${amount} ${symbol}`);

        Modal.close();
      });
    });
  });
};

import * as modal from '../modal';
import { formatSymbol } from '../../utils/strings';
import { ERC20TokenSymbol } from '../../utils/contracts';

type TestParams = {
  type: 'floating' | 'fixed';
  symbol: ERC20TokenSymbol;
  amount?: string;
  balance?: string;
  shouldApprove?: boolean;
};

export default ({ type, symbol, amount = '1', balance = '100', shouldApprove = false }: TestParams) => {
  describe(`${symbol} ${type} repay`, () => {
    it('should open the modal', () => {
      modal.open(type, 'repay', symbol);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Repay');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);
      });
    });

    describe('the input', () => {
      afterEach(() => {
        modal.clearInput();
      });

      it(`should not allow to repay more than what's present in the wallet (${balance} ${symbol})`, () => {
        const aboveBalanceAmount = String(Number(balance) + 1);
        modal.input(aboveBalanceAmount);
        modal.checkAlert('error', `You can't repay more than you have in your wallet`);
      });

      it(`should allow to input the amount ${amount}`, () => {
        modal.input(amount);
        modal.checkAlertNotFound('error');
      });
    });

    describe('the transaction', () => {
      it('should be successful', () => {
        modal.input(amount);

        if (shouldApprove) {
          modal.waitForApprove();
          modal.approve();
        }

        modal.waitForSubmit();

        modal.submit();
        modal.waitForTransaction('repay');

        modal.checkTransactionStatus('success', `You repayed ${amount} ${formatSymbol(symbol)}`);

        modal.close();
      });
    });
  });
};

import * as modal from '../modal';
import { formatSymbol, repeat } from '../../utils/strings';
import { ERC20TokenSymbol } from '../../utils/contracts';

type TestParams = {
  type: 'floating' | 'fixed';
  symbol: ERC20TokenSymbol;
  decimals: number;
  balance: string;
  amount?: string;
  shouldApprove?: boolean;
};

export default ({ type, symbol, decimals, balance, amount = '1', shouldApprove = false }: TestParams) => {
  describe(`${symbol} ${type} deposit`, () => {
    it('should open the modal', () => {
      modal.open(type, 'deposit', symbol);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Deposit');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);
        modal.checkWalletBalance(balance);
      });
    });

    describe('the input', () => {
      afterEach(() => {
        modal.clearInput();
      });

      it('should not allow to input more decimals than the allowed', () => {
        const inp = `0.${repeat(decimals + 1, '1')}`;
        modal.input(inp);
        modal.checkInput(inp.slice(0, inp.length - 1));
      });

      if (!shouldApprove) {
        it('should warn if the user tries to deposit more than its current balance', () => {
          const aboveBalance = Number(balance) + 1;
          modal.input(String(aboveBalance));
          modal.checkSubmitErrorButton('Insufficient balance');
        });
      }

      it('should input the wallet balance on max', () => {
        modal.onMax();
        modal.checkInput(balance);
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
        modal.waitForTransaction('deposit');

        modal.checkTransactionStatus('success', `You deposited ${amount} ${formatSymbol(symbol)}`);

        modal.close();
      });
    });
  });
};

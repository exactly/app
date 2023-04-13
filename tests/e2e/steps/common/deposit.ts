import * as modal from '../modal';
import { formatMaturity, formatSymbol, repeat } from '../../utils/strings';
import { ERC20TokenSymbol } from '../../utils/contracts';

type TestParams = (
  | {
      type: 'floating';
      maturity?: number;
    }
  | {
      type: 'fixed';
      maturity: number;
    }
) & {
  symbol: ERC20TokenSymbol;
  decimals: number;
  amount?: string;
  balance?: string;
  maxYield?: string;
  shouldApprove?: boolean;
};

export default ({
  type,
  symbol,
  decimals,
  balance,
  amount = '1',
  shouldApprove = false,
  maturity,
  maxYield,
}: TestParams) => {
  describe(`${symbol} ${type} deposit`, () => {
    it('should open the modal', () => {
      modal.open(type, 'deposit', symbol, maturity);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Deposit');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);
        modal.checkWalletBalance(balance);

        if (type === 'fixed') {
          modal.checkPoolDate(maturity);
        }
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

        it('should input the wallet balance on max', () => {
          modal.onMax();
          modal.checkInput(balance);
        });
      }

      if (type === 'fixed' && maxYield) {
        it('should warn the user about depositing more than the optimal amount', () => {
          modal.input(maxYield);
          modal.checkAlert('warning', 'You have reached the maximum yield possible');
        });
      }

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

        modal.checkTransactionStatus(
          'success',
          `You deposited ${amount} ${formatSymbol(symbol)}${
            type === 'fixed' ? ` until ${formatMaturity(maturity)}` : ''
          }`,
        );

        if (type === 'fixed') {
          modal.checkReminder('deposit');
        }

        modal.close();
      });
    });
  });
};

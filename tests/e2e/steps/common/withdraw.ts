import * as modal from '../modal';
import * as navbar from '../navbar';
import { formatSymbol } from '../../utils/strings';
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
  amount?: string;
  shouldApprove?: boolean;
};

export default ({ type, symbol, amount = '1', shouldApprove = false, maturity }: TestParams) => {
  describe(`${symbol} ${type} withdraw`, () => {
    it('should be in the correct page', () => {
      cy.url().then((url) => {
        if (!url.includes('/dashboard')) {
          navbar.goTo('dashboard');
        }
      });
    });

    it('should open the modal', () => {
      modal.open(type, 'withdraw', symbol, maturity);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Withdraw');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);

        if (type === 'fixed') {
          modal.checkPoolDate(maturity);
        }
      });
    });

    describe('the input', () => {
      it(`should allow to input the amount ${amount}`, () => {
        modal.input(amount);
        modal.checkAlertNotFound('error');
      });
    });

    describe('the transaction', () => {
      it('should be successful', () => {
        if (shouldApprove) {
          modal.waitForApprove();
          modal.approve();
        }

        modal.waitForSubmit();

        modal.submit();
        modal.waitForTransaction('withdraw');

        modal.checkTransactionStatus('success', `You withdrawn ${amount} ${formatSymbol(symbol)}`);

        modal.close();
      });
    });
  });
};

export const attemptWithdraw = ({ type, symbol, amount = '1', maturity }: Omit<TestParams, 'shouldApprove'>) => {
  describe(`${symbol} ${type} attempt withdraw`, () => {
    after(() => {
      modal.close();
    });

    it('should be in the correct page', () => {
      cy.url().then((url) => {
        if (!url.includes('/dashboard')) {
          navbar.goTo('dashboard');
        }
      });
    });

    it('should open the modal', () => {
      modal.open(type, 'withdraw', symbol, maturity);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Withdraw');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);
      });
    });

    describe('the input', () => {
      it(`should warn if the user tries to withdraw with no deposits previously made for ${symbol}`, () => {
        modal.input(amount);
        modal.checkAlert('error', `You can't withdraw more than the deposited amount`);
      });
    });
  });
};

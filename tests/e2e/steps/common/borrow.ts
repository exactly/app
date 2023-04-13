import * as modal from '../modal';
import { formatMaturity, formatSymbol } from '../../utils/strings';
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
  aboveLimitAmount?: string | number;
  aboveLiquidityAmount?: string | number;
  shouldApprove?: boolean;
};

export default ({
  type,
  symbol,
  amount = '1',
  aboveLimitAmount,
  aboveLiquidityAmount,
  shouldApprove = false,
  maturity,
}: TestParams) => {
  describe(`${symbol} ${type} borrow`, () => {
    it('should open the modal', () => {
      modal.open(type, 'borrow', symbol, maturity);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Borrow');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);

        if (type === 'fixed') {
          modal.checkPoolDate(maturity);
        }
      });
    });

    describe('the input', () => {
      afterEach(() => {
        modal.clearInput();
      });

      if (aboveLimitAmount) {
        it('should warn if the user tries to borrow more than its current borrow limit', () => {
          modal.input(String(aboveLimitAmount));
          modal.checkAlert('error', "You can't borrow more than your borrow limit");
        });
      }

      if (aboveLiquidityAmount) {
        it('should warn if the user tries to borrow more than the current liquidity of the pool', () => {
          modal.input(String(aboveLiquidityAmount));
          modal.checkAlert('error', 'There is not enough liquidity');
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
        modal.waitForTransaction('borrow');

        modal.checkTransactionStatus(
          'success',
          `You borrowed ${amount} ${formatSymbol(symbol)}${
            type === 'fixed' ? ` until ${formatMaturity(maturity)}` : ''
          }`,
        );

        if (type === 'fixed') {
          modal.checkReminder('borrow');
        }

        modal.close();
      });
    });
  });
};

export const attemptBorrow = ({ type, symbol, amount = '1' }: Omit<TestParams, 'shouldApprove' | 'decimals'>) => {
  describe(`${symbol} ${type} attempt borrow`, () => {
    after(() => {
      modal.close();
    });

    it('should open the modal', () => {
      modal.open(type, 'borrow', symbol);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        modal.checkTitle('Borrow');
        modal.checkType(type);
        modal.checkAssetSelection(symbol);
      });
    });

    describe('the input', () => {
      it(`should warn if the user tries to borrow with no collateral enabled for ${symbol}`, () => {
        modal.input(amount);
        modal.checkAlert(
          'warning',
          'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
        );
      });
    });
  });
};

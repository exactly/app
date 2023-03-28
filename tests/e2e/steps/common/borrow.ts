import * as modal from '../modal';
import { formatSymbol, repeat } from '../../utils/strings';
import { ERC20TokenSymbol } from '../../utils/contracts';

type TestParams = {
  type: 'floating' | 'fixed';
  symbol: ERC20TokenSymbol;
  decimals: number;
  amount?: string;
  aboveLimitAmount?: string | number;
  aboveLiquidityAmount?: string | number;
  shouldApprove?: boolean;
};

export default ({
  type,
  symbol,
  decimals,
  amount = '1',
  aboveLimitAmount,
  aboveLiquidityAmount,
  shouldApprove = false,
}: TestParams) => {
  describe(`${symbol} ${type} borrow`, () => {
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
      afterEach(() => {
        modal.clearInput();
      });

      it('should not allow to input more decimals than the allowed', () => {
        const inp = `0.${repeat(decimals + 1, '1')}`;
        modal.input(inp);
        modal.checkInput(inp.slice(0, inp.length - 1));
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

        modal.checkTransactionStatus('success', `You borrowed ${amount} ${formatSymbol(symbol)}`);

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

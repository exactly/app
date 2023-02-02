import * as Modal from '../modal';
import { repeat } from '../../utils/strings';
import { Coin } from '../../utils/tenderly';

type TestParams = {
  type: 'floating' | 'fixed';
  symbol: Coin;
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
      Modal.open(type, 'borrow', symbol);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        Modal.checkTitle('Borrow');
        Modal.checkType(type);
        Modal.checkAssetSelection(symbol);
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

      if (aboveLimitAmount) {
        it('should warn if the user tries to borrow more than its current borrow limit', () => {
          Modal.input(String(aboveLimitAmount));
          Modal.checkAlert('error', "You can't borrow more than your borrow limit");
        });
      }

      if (aboveLiquidityAmount) {
        it('should warn if the user tries to borrow more than the current liquidity of the pool', () => {
          Modal.input(String(aboveLiquidityAmount));
          Modal.checkAlert('error', 'There is not enough liquidity');
        });
      }

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
        Modal.waitForTransaction('borrow');

        Modal.checkTransactionStatus('success', `Borrowed ${amount} ${symbol}`);

        Modal.close();
      });
    });
  });
};

export const attemptBorrow = ({ type, symbol, amount = '1' }: Omit<TestParams, 'shouldApprove' | 'decimals'>) => {
  describe(`${symbol} ${type} attempt borrow`, () => {
    after(() => {
      Modal.close();
    });

    it('should open the modal', () => {
      Modal.open(type, 'borrow', symbol);
    });

    describe('the modal', () => {
      it('should have the correct descriptions', () => {
        Modal.checkTitle('Borrow');
        Modal.checkType(type);
        Modal.checkAssetSelection(symbol);
      });
    });

    describe('the input', () => {
      it(`should warn if the user tries to borrow with no collateral enabled for ${symbol}`, () => {
        Modal.input(amount);
        Modal.checkAlert(
          'error',
          'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
        );
      });
    });
  });
};

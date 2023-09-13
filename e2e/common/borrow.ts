import _modal from '../components/modal';
import { formatMaturity, formatSymbol } from '../utils/strings';
import type { ERC20TokenSymbol } from '../utils/contracts';
import type { CommonTest } from './types';

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

export default function ({ test, page }: CommonTest) {
  const modal = _modal(page);

  const execute = async ({
    type,
    symbol,
    amount = '1',
    aboveLimitAmount,
    aboveLiquidityAmount,
    shouldApprove = false,
    maturity,
  }: TestParams) => {
    await test.step(`${symbol} ${type} borrow`, async () => {
      await test.step('should open the modal', async () => {
        await modal.open(type, 'borrow', symbol, maturity);
      });

      await test.step('the modal', async () => {
        await test.step('should have the correct descriptions', async () => {
          await modal.checkTitle('Borrow');
          await modal.checkType(type);
          await modal.checkAssetSelection(symbol);

          if (type === 'fixed') {
            await modal.checkPoolDate(maturity);
          }
        });
      });

      await test.step('the input', async () => {
        if (aboveLimitAmount) {
          await test.step('should warn if the user tries to borrow more than its current borrow limit', async () => {
            await modal.input(String(aboveLimitAmount));
            await modal.checkAlert('error', "You can't borrow more than your borrow limit");

            await modal.clearInput();
          });
        }

        if (aboveLiquidityAmount) {
          await test.step('should warn if the user tries to borrow more than the current liquidity of the pool', async () => {
            await modal.input(String(aboveLiquidityAmount));
            await modal.checkAlert('error', 'There is not enough liquidity');

            await modal.clearInput();
          });
        }

        await test.step(`should allow to input the amount ${amount}`, async () => {
          await modal.input(amount);
          modal.checkAlertNotFound('error');
        });
      });

      await test.step('the transaction', async () => {
        await test.step('should be successful', async () => {
          if (shouldApprove) {
            await modal.waitForApprove();
            await modal.approve();
          }

          await modal.waitForSubmit();

          await modal.submit();
          await modal.waitForTransaction('borrow');

          await modal.checkTransactionStatus(
            'success',
            `You borrowed ${amount} ${formatSymbol(symbol)}${
              type === 'fixed' ? ` until ${formatMaturity(maturity)}` : ''
            }`,
          );

          if (type === 'fixed') {
            await modal.checkReminder('borrow');
          }

          await modal.close();
        });
      });
    });
  };

  const attempt = async ({ type, symbol, amount = '1' }: Omit<TestParams, 'shouldApprove' | 'decimals'>) => {
    await test.step(`${symbol} ${type} attempt borrow`, async () => {
      await test.step('should open the modal', async () => {
        await modal.open(type, 'borrow', symbol);
      });

      await test.step('the modal', async () => {
        await test.step('should have the correct descriptions', async () => {
          await modal.checkTitle('Borrow');
          await modal.checkType(type);
          await modal.checkAssetSelection(symbol);
        });
      });

      await test.step('the input', async () => {
        await test.step(`should warn if the user tries to borrow with no collateral enabled for ${symbol}`, async () => {
          await modal.input(amount);
          await modal.checkAlert(
            'warning',
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
          );
        });
      });

      await modal.close();
    });
  };

  return { execute, attempt };
}

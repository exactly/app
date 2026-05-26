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
    maturity,
  }: TestParams) => {
    await test.step(`operation: borrow ${symbol} ${type}`, async () => {
      await test.step(`modal: open borrow ${symbol} ${type}`, async () => {
        await modal.open(type, 'borrow', symbol, maturity);
      });

      await test.step(`modal: validate borrow ${symbol} ${type}`, async () => {
        await modal.checkTitle('Borrow');
        await modal.checkType(type);
        await modal.checkAssetSelection(symbol);

        if (type === 'fixed') {
          await modal.checkPoolDate(maturity);
        }
      });

      await test.step(`input: borrow ${symbol}`, async () => {
        if (aboveLimitAmount) {
          await test.step('input: reject above borrow limit', async () => {
            await modal.input(String(aboveLimitAmount));
            await modal.checkAlert('error', "You can't borrow more than your borrow limit");

            await modal.clearInput();
          });
        }

        if (aboveLiquidityAmount) {
          await test.step('input: reject above pool liquidity', async () => {
            await modal.input(String(aboveLiquidityAmount));
            await modal.checkAlert('error', 'There is not enough liquidity');

            await modal.clearInput();
          });
        }

        await test.step(`input: fill borrow amount ${amount}`, async () => {
          await modal.input(amount);
          await modal.checkAlertNotFound('error');
        });
      });

      await test.step(`tx: borrow ${symbol} ${type}`, async () => {
        await test.step(`tx: submit borrow ${symbol} ${type}`, async () => {
          await modal.submit();
        });

        await test.step(`tx: wait borrow ${symbol} ${type}`, async () => {
          await modal.waitForTransaction('borrow');
        });

        await test.step('tx: assert borrow success', async () => {
          await modal.checkTransactionStatus(
            'success',
            `You borrowed ${amount} ${formatSymbol(symbol)}${
              type === 'fixed' ? ` until ${formatMaturity(maturity)}` : ''
            }`,
          );

          if (type === 'fixed') {
            await modal.checkReminder('borrow');
          }
        });

        await test.step('modal: close borrow', async () => {
          await modal.close();
        });
      });
    });
  };

  const attempt = async ({ type, symbol, amount = '1' }: Omit<TestParams, 'shouldApprove' | 'decimals'>) => {
    await test.step(`operation: attempt borrow ${symbol} ${type}`, async () => {
      await test.step(`modal: open borrow ${symbol} ${type}`, async () => {
        await modal.open(type, 'borrow', symbol);
      });

      await test.step(`modal: validate borrow ${symbol} ${type}`, async () => {
        await modal.checkTitle('Borrow');
        await modal.checkType(type);
        await modal.checkAssetSelection(symbol);
      });

      await test.step(`input: borrow ${symbol}`, async () => {
        await test.step('input: reject borrow without collateral', async () => {
          await modal.input(amount);
          await modal.checkAlert(
            'warning',
            'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
          );
        });
      });

      await test.step('modal: close borrow attempt', async () => {
        await modal.close();
      });
    });
  };

  return { execute, attempt };
}

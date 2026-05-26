import _modal from '../components/modal';
import _navbar from '../components/navbar';
import { formatSymbol } from '../utils/strings';
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
  shouldApprove?: boolean;
};

export default function ({ test, page }: CommonTest) {
  const modal = _modal(page);
  const navbar = _navbar(page);

  const execute = async ({ type, symbol, amount = '1', maturity }: TestParams) => {
    await test.step(`operation: withdraw ${symbol} ${type}`, async () => {
      await test.step('navigation: dashboard', async () => {
        if (!page.url().endsWith('/dashboard')) {
          await navbar.goTo('dashboard');
        }
      });

      await test.step(`modal: open withdraw ${symbol} ${type}`, async () => {
        await modal.open(type, 'withdraw', symbol, maturity);
      });

      await test.step(`modal: validate withdraw ${symbol} ${type}`, async () => {
        await modal.checkTitle('Withdraw');
        await modal.checkType(type);
        await modal.checkAssetSelection(symbol);

        if (type === 'fixed') {
          await modal.checkPoolDate(maturity);
        }
      });

      await test.step(`input: withdraw ${symbol}`, async () => {
        await test.step(`input: fill withdraw amount ${amount}`, async () => {
          await modal.input(amount);
          await modal.checkAlertNotFound('error');
        });
      });

      await test.step(`tx: withdraw ${symbol} ${type}`, async () => {
        await test.step(`tx: submit withdraw ${symbol} ${type}`, async () => {
          await modal.submit();
        });

        await test.step(`tx: wait withdraw ${symbol} ${type}`, async () => {
          await modal.waitForTransaction('withdraw');
        });

        await test.step('tx: assert withdraw success', async () => {
          await modal.checkTransactionStatus('success', `You withdrawn ${amount} ${formatSymbol(symbol)}`);
        });

        await test.step('modal: close withdraw', async () => {
          await modal.close();
        });
      });
    });
  };

  const attempt = async ({ type, symbol, amount = '1', maturity }: Omit<TestParams, 'shouldApprove'>) => {
    await test.step(`operation: attempt withdraw ${symbol} ${type}`, async () => {
      await test.step('navigation: dashboard', async () => {
        if (!page.url().endsWith('/dashboard')) {
          await navbar.goTo('dashboard');
        }
      });

      await test.step(`modal: open withdraw ${symbol} ${type}`, async () => {
        await modal.open(type, 'withdraw', symbol, maturity);
      });

      await test.step(`modal: validate withdraw ${symbol} ${type}`, async () => {
        await modal.checkTitle('Withdraw');
        await modal.checkType(type);
        await modal.checkAssetSelection(symbol);
      });

      await test.step(`input: withdraw ${symbol}`, async () => {
        await test.step('input: reject above deposited amount', async () => {
          await modal.input(amount);
          await modal.checkAlert('error', `You can't withdraw more than the deposited amount`);
        });
      });

      await test.step('modal: close withdraw attempt', async () => {
        await modal.close();
      });
    });
  };

  return { execute, attempt };
}

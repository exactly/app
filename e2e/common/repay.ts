import _dashboard from '../page/dashboard';
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

export default function ({ page, test }: CommonTest) {
  const dashboard = _dashboard(page);
  const modal = _modal(page);
  const navbar = _navbar(page);

  const execute = async ({ type, symbol, amount = '1', maturity }: TestParams) => {
    await test.step(`operation: repay ${symbol} ${type}`, async () => {
      await test.step('navigation: dashboard borrow tab', async () => {
        if (!page.url().endsWith('/dashboard')) {
          await navbar.goTo('dashboard');
          await dashboard.switchTab('borrow');
        }
      });

      await test.step(`modal: open repay ${symbol} ${type}`, async () => {
        await modal.open(type, 'repay', symbol, maturity);
      });

      await test.step(`modal: validate repay ${symbol} ${type}`, async () => {
        await modal.checkTitle('Repay');
        await modal.checkType(type);
        await modal.checkAssetSelection(symbol);

        if (type === 'fixed') {
          await modal.checkPoolDate(maturity);
        }
      });

      await test.step(`input: repay ${symbol}`, async () => {
        await test.step(`input: fill repay amount ${amount}`, async () => {
          await modal.input(amount);
          await modal.checkAlertNotFound('error');
        });
      });

      await test.step(`tx: repay ${symbol} ${type}`, async () => {
        await test.step(`tx: submit repay ${symbol} ${type}`, async () => {
          await modal.submit();
        });

        await test.step(`tx: wait repay ${symbol} ${type}`, async () => {
          await modal.waitForTransaction('repay');
        });

        await test.step('tx: assert repay success', async () => {
          await modal.checkTransactionStatus('success', `You repayed ${amount} ${formatSymbol(symbol)}`);
        });

        await test.step('modal: close repay', async () => {
          await modal.close();
        });
      });
    });
  };

  return { execute };
}

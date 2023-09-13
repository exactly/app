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

  const execute = async ({ type, symbol, amount = '1', shouldApprove = false, maturity }: TestParams) => {
    await test.step(`${symbol} ${type} repay`, async () => {
      await test.step('should be in the correct page', async () => {
        if (!page.url().endsWith('/dashboard')) {
          await navbar.goTo('dashboard');
          await dashboard.switchTab('borrow');
        }
      });

      await test.step('should open the modal', async () => {
        await modal.open(type, 'repay', symbol, maturity);
      });

      await test.step('the modal', async () => {
        await test.step('should have the correct descriptions', async () => {
          await modal.checkTitle('Repay');
          await modal.checkType(type);
          await modal.checkAssetSelection(symbol);

          if (type === 'fixed') {
            await modal.checkPoolDate(maturity);
          }
        });
      });

      await test.step('the input', async () => {
        await test.step(`should allow to input the amount ${amount}`, async () => {
          await modal.input(amount);
          await modal.checkAlertNotFound('error');
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
          await modal.waitForTransaction('repay');

          await modal.checkTransactionStatus('success', `You repayed ${amount} ${formatSymbol(symbol)}`);

          await modal.close();
        });
      });
    });
  };

  return { execute };
}

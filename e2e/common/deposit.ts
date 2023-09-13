import _modal from '../components/modal';
import { formatMaturity, formatSymbol, repeat } from '../utils/strings';
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
  decimals: number;
  amount?: string;
  balance?: string;
  shouldApprove?: boolean;
};

export default function ({ test, page }: CommonTest) {
  const modal = _modal(page);

  const execute = async ({
    type,
    symbol,
    decimals,
    balance,
    amount = '1',
    shouldApprove = false,
    maturity,
  }: TestParams) => {
    await test.step(`${symbol} ${type} deposit`, async () => {
      await test.step('should open the modal', async () => {
        await modal.open(type, 'deposit', symbol, maturity);
      });

      await test.step('the modal', () => {
        test.step('should have the correct descriptions', async () => {
          await modal.checkTitle('Deposit');
          await modal.checkType(type);
          await modal.checkAssetSelection(symbol);

          if (balance) {
            await modal.checkWalletBalance(balance);
          }

          if (type === 'fixed') {
            await modal.checkPoolDate(maturity);
          }
        });
      });

      await test.step('the input', async () => {
        await test.step('should not allow to input more decimals than the allowed', async () => {
          const inp = `0.${repeat(decimals + 1, '1')}`;
          await modal.input(inp);
          await modal.checkInput(inp.slice(0, inp.length - 1));
          await modal.clearInput();
        });

        if (!shouldApprove && balance) {
          await test.step('should warn if the user tries to deposit more than its current balance', async () => {
            const aboveBalance = Number(balance) + 1;
            await modal.input(String(aboveBalance));
            await modal.checkSubmitErrorButton('Insufficient balance');
            await modal.clearInput();
          });

          await test.step('should input the wallet balance on max', async () => {
            await modal.onMax();
            await modal.checkInput(balance);
            await modal.clearInput();
          });
        }

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
          await modal.waitForTransaction('deposit');

          await modal.checkTransactionStatus(
            'success',
            `You deposited ${amount} ${formatSymbol(symbol)}${
              type === 'fixed' ? ` until ${formatMaturity(maturity)}` : ''
            }`,
          );

          if (type === 'fixed') {
            await modal.checkReminder('deposit');
          }

          await modal.close();
        });
      });
    });
  };

  return { execute };
}

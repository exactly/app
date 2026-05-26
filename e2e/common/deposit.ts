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
    await test.step(`operation: deposit ${symbol} ${type}`, async () => {
      await test.step(`modal: open deposit ${symbol} ${type}`, async () => {
        await modal.open(type, 'deposit', symbol, maturity);
      });

      await test.step(`modal: validate deposit ${symbol} ${type}`, async () => {
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

      await test.step(`input: deposit ${symbol}`, async () => {
        await test.step('input: reject excess decimals', async () => {
          const inp = `0.${repeat(decimals + 1, '1')}`;
          await modal.input(inp);
          await modal.checkInput(inp.slice(0, inp.length - 1));
          await modal.clearInput();
        });

        if (!shouldApprove && balance) {
          await test.step('input: reject above account balance', async () => {
            const aboveBalance = Number(balance) + 1;
            await modal.input(String(aboveBalance));
            await modal.checkSubmitErrorButton('Insufficient balance');
            await modal.clearInput();
          });

          await test.step('input: fill max account balance', async () => {
            await modal.onMax();
            await modal.checkInput(balance);
            await modal.clearInput();
          });
        }

        await test.step(`input: fill deposit amount ${amount}`, async () => {
          await modal.input(amount);
          await modal.checkAlertNotFound('error');
        });
      });

      await test.step(`tx: deposit ${symbol} ${type}`, async () => {
        await test.step(`tx: submit deposit ${symbol} ${type}`, async () => {
          await modal.submit();
        });

        await test.step(`tx: wait deposit ${symbol} ${type}`, async () => {
          await modal.waitForTransaction('deposit');
        });

        await test.step('tx: assert deposit success', async () => {
          await modal.checkTransactionStatus(
            'success',
            `You deposited ${amount} ${formatSymbol(symbol)}${
              type === 'fixed' ? ` until ${formatMaturity(maturity)}` : ''
            }`,
          );

          if (type === 'fixed') {
            await modal.checkReminder('deposit');
          }
        });

        await test.step('modal: close deposit', async () => {
          await modal.close();
        });
      });
    });
  };

  return { execute };
}

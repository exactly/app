import { type Page, expect } from '@playwright/test';

import type { ERC20TokenSymbol } from '../utils/contracts';
import { formatMaturity, formatSymbol } from '../utils/strings';

export type Operation = 'deposit' | 'borrow' | 'withdraw' | 'repay';

export default function (page: Page) {
  const waitForModalReady = async () => {
    const modal = page.getByTestId('modal');
    await expect(modal).toBeVisible();

    await page.waitForFunction(
      () => {
        return ['submit', 'approve'].every((action) => {
          const button = document.querySelector(`[data-testid="modal-${action}"]`);
          if (!button) return true;
          return !button.classList.contains('MuiLoadingButton-loading');
        });
      },
      null,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  const open = async (type: 'floating' | 'fixed', action: Operation, symbol: ERC20TokenSymbol, maturity?: number) => {
    await page.getByTestId(`${type}-${maturity ? `${maturity}-` : ''}${action}-${symbol}`).click();
    await waitForModalReady();
  };

  const close = async () => {
    await page.getByTestId('modal-close').click();
    await expect(page.getByTestId('modal')).not.toBeVisible();
  };

  const input = async (inp: string) => {
    const modalInput = page.getByTestId('modal-input');
    await expect(modalInput).toBeVisible();

    await modalInput.fill(inp);
  };

  const checkInput = async (inp: string) => {
    await expect(page.getByTestId('modal-input')).toHaveValue(
      new RegExp(`^(${Number(inp) + 1}|${inp}|${Number(inp) - 1})`),
    );
  };

  const clearInput = async () => {
    await page.getByTestId('modal-input').clear();
  };

  const onMax = async () => {
    await page.getByTestId('modal-on-max').click();
  };

  const waitForApprove = async () => {
    const approve = page.getByTestId('modal-approve');
    await expect(approve).toBeVisible({ timeout: 30_000 });

    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="modal-approve"]');
        if (!button) return false;
        return !button.classList.contains('MuiLoadingButton-loading');
      },
      null,
      { timeout: 30_000, polling: 1_000 },
    );
  };

  const approve = async () => {
    const button = page.getByTestId('modal-approve');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForSubmit = async () => {
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="modal-submit"]');
        if (!button) return false;
        return !button.classList.contains('MuiLoadingButton-loading');
      },
      null,
      { timeout: 30_000, polling: 1_000 },
    );
  };

  const submit = async () => {
    const button = page.getByTestId('modal-submit');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();

    await button.click();
  };

  const waitForTransaction = async (op: Operation) => {
    const status = page.getByTestId('modal-transaction-status');

    await expect(status).toBeVisible({ timeout: 30_000 });

    await page.waitForFunction(
      (message) => {
        const text = document.querySelector('[data-testid="modal-transaction-status"]');
        if (!text) return false;
        return text.textContent !== message;
      },
      `Sending ${op}...`,
      { timeout: 30_000, polling: 1_000 },
    );
  };

  const checkTransactionStatus = async (target: 'success' | 'error', summary: string) => {
    const status = page.getByTestId('modal-transaction-status');

    await expect(status).toHaveText(`Transaction ${target === 'success' ? 'completed' : target}`);
    await expect(page.getByTestId('modal-transaction-summary')).toHaveText(summary);
  };

  const checkReminder = async (operation: Extract<Operation, 'deposit' | 'borrow'>) => {
    await expect(page.getByTestId('modal-transaction-reminder')).toBeVisible();

    await expect(page.getByTestId('modal-transaction-reminder-title')).toHaveText(
      operation === 'deposit' ? 'Remember to withdraw your assets' : 'Remember to pay before the maturity date',
    );
  };

  const checkTitle = async (title: string) => {
    await expect(page.getByTestId('modal-title')).toHaveText(title);
  };

  const checkType = async (type: 'floating' | 'fixed') => {
    const collateral = page.getByTestId(`modal-type-switch-${type === 'floating' ? 'variable' : type}`);
    await expect(collateral).toHaveAttribute('aria-selected', 'true');
  };

  const checkAssetSelection = async (symbol: ERC20TokenSymbol) => {
    await expect(page.getByTestId('modal-asset-selector')).toHaveText(formatSymbol(symbol));
  };

  const checkWalletBalance = async (balance: string) => {
    await expect(page.getByTestId('modal-amount-info')).toContainText(balance);
  };

  const checkPoolDate = async (maturity: number) => {
    await expect(page.getByTestId('modal-date-selector')).toContainText(formatMaturity(maturity));
  };

  const checkAlert = async (variant: 'info' | 'warning' | 'error' | 'success', message: string) => {
    const modalAlert = page.getByTestId(`modal-alert-${variant}`);

    await expect(modalAlert).toBeVisible();
    await expect(modalAlert).toHaveText(message);
  };

  const checkAlertNotFound = async (variant: 'info' | 'warning' | 'error' | 'success') => {
    const modalAlert = page.getByTestId(`modal-alert-${variant}`);
    await expect(modalAlert).not.toBeVisible();
  };

  const checkSubmitErrorButton = async (message: string) => {
    const button = page.getByTestId('modal-submit');
    await expect(button).toBeVisible();
    await expect(button).toBeDisabled();
    await expect(button).toHaveText(message);
  };

  return {
    open,
    close,
    input,
    checkInput,
    clearInput,
    onMax,
    waitForApprove,
    approve,
    waitForSubmit,
    submit,
    waitForTransaction,
    checkTransactionStatus,
    checkReminder,
    checkTitle,
    checkType,
    checkAssetSelection,
    checkWalletBalance,
    checkPoolDate,
    checkAlert,
    checkAlertNotFound,
    checkSubmitErrorButton,
  };
}

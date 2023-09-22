import { type Page, expect } from '@playwright/test';

import type { ERC20TokenSymbol } from '../utils/contracts';
import { formatMaturity } from '../utils/strings';

export default function (page: Page) {
  const waitForModalReady = async () => {
    const modal = page.getByTestId('rollover-modal');
    await expect(modal).toBeVisible();

    await page.waitForFunction(
      () => {
        return ['submit', 'approve'].every((action) => {
          const button = document.querySelector(`[data-testid="rollover-${action}"]`);
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

  const cta = (type: 'floating' | 'fixed', symbol: ERC20TokenSymbol, maturity?: number) => {
    return page.getByTestId(`${type}-rollover${maturity ? `-${maturity}` : ''}-${symbol}`);
  };

  const open = async (type: 'floating' | 'fixed', symbol: ERC20TokenSymbol, maturity?: number) => {
    await cta(type, symbol, maturity).click();
    await waitForModalReady();
  };

  const close = async () => {
    await page.getByTestId('rollover-modal-close').click();
    await expect(page.getByTestId('rollover-modal')).not.toBeVisible();
  };

  const checkOption = async (
    option: 'from' | 'to',
    stats: { type: 'empty' } | { type: 'floating' } | { type: 'fixed'; maturity: number },
  ) => {
    const button = page.getByTestId(`rollover-${option}`);
    const label = page.getByTestId(`rollover-${option}-label`);
    switch (stats.type) {
      case 'empty':
        await expect(button).toHaveText(option === 'from' ? 'Current debt' : 'New debt');
        await expect(label).toHaveText('Maturity');
        break;
      case 'floating':
        await expect(button).toHaveText('Variable');
        await expect(label).toHaveText('Open-ended');
        break;
      case 'fixed':
        await expect(button).toHaveText('Fixed');
        await expect(label).toHaveText(formatMaturity(stats.maturity));
        break;
    }
  };

  const openSheet = async (option: 'from' | 'to') => {
    await page.getByTestId(`rollover-${option}`).click();
    await expect(page.getByTestId(`rollover-sheet-${option}`)).toBeVisible();
  };

  const selectDebt = async (symbol: ERC20TokenSymbol, maturity?: number) => {
    const row = page.getByTestId(`rollover-sheet-row-${symbol}${maturity ? `-${maturity}` : ''}`);
    await expect(row).toBeVisible();
    await row.click();
  };

  const submit = async () => {
    const button = page.getByTestId('rollover-submit');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();

    await button.click();
  };

  const waitForTransaction = async () => {
    const status = page.getByTestId('transaction-status');

    await expect(status).toBeVisible({ timeout: 30_000 });

    await page.waitForFunction(
      (message) => {
        const text = document.querySelector('[data-testid="transaction-status"]');
        if (!text) return false;
        return text.textContent !== message;
      },
      'Processing transaction...',
      { timeout: 30_000, polling: 1_000 },
    );
  };

  const checkTransactionStatus = async (target: 'success' | 'error', summary: string) => {
    const status = page.getByTestId('transaction-status');

    await expect(status).toHaveText(`Transaction ${target === 'success' ? 'completed' : target}`);
    await expect(page.getByTestId('transaction-summary')).toHaveText(summary);
  };

  return {
    waitForModalReady,
    cta,
    open,
    close,
    checkOption,
    openSheet,
    selectDebt,
    submit,
    waitForTransaction,
    checkTransactionStatus,
  };
}

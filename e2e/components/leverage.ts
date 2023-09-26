import { type Page, expect } from '@playwright/test';

import type { ERC20TokenSymbol } from '../utils/contracts';

export default function (page: Page) {
  const waitSummaryToBeReady = async () => {
    await page.waitForFunction(
      () => {
        return ['approve', 'submit'].every((value) => {
          const button = document.querySelector(`[data-testid="leverage-${value}"]`);
          if (!button) return true;
          const clx = !button.classList.contains('MuiLoadingButton-loading');
          const attr = button.getAttribute('disabled');
          return clx && attr === null;
        });
      },
      null,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  const waitForSkeletons = async () => {
    await page.waitForFunction(
      () => {
        const modal = document.querySelector('[data-testid="leverage-modal"]');
        return modal && modal.querySelectorAll('.MuiSkeleton-root').length === 0;
      },
      null,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  const waitForStepToContinue = async () => {
    await waitForSkeletons();
    await page.waitForFunction(
      () => {
        const button = document.querySelector(`[data-testid="leverage-modal-continue"]`);
        if (!button) return true;
        const attr = button.getAttribute('disabled');
        return attr === null;
      },
      null,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  const cta = () => {
    return page.getByTestId('leverage');
  };

  const open = async () => {
    await cta().click();

    const modal = page.getByTestId('leverage-modal');
    await expect(modal).toBeVisible();
  };

  const close = async () => {
    await page.getByTestId('leverage-modal-close').click();
    await expect(page.getByTestId('leverage-modal')).not.toBeVisible();
  };

  const checkOption = async (
    option: 'from' | 'to',
    stats: { type: 'empty' } | { type: 'selected'; symbol: ERC20TokenSymbol },
  ) => {
    const button = page.getByTestId(`leverage-select-${option}`);
    switch (stats.type) {
      case 'empty':
        await expect(button).toHaveText('Choose Asset');
        break;
      case 'selected':
        await expect(button).toHaveText(stats.symbol);
        break;
    }
  };

  const selectAsset = async (option: 'from' | 'to', symbol: ERC20TokenSymbol) => {
    await page.getByTestId(`leverage-select-${option}`).click();

    const row = page.getByTestId(`leverage-select-${option}-${symbol}`);
    await expect(row).toBeVisible();
    await row.click();
  };

  const selectMultiplier = async (
    option: { type: 'min' } | { type: 'max' } | { type: 'mid' } | { type: 'custom'; value: number },
  ) => {
    const slider = page.getByTestId('leverage-slider');
    await expect(slider).not.toBeDisabled();

    switch (option.type) {
      case 'min': {
        await page.getByTestId('leverage-slider-min').click();
        break;
      }

      case 'max': {
        await page.getByTestId('leverage-slider-max').click();
        break;
      }

      case 'mid': {
        const mid = await slider.evaluate((el) => {
          return el.getBoundingClientRect().width / 2;
        });
        await slider.hover({ force: true, position: { x: mid, y: 0 } });
        await slider.click({ position: { x: mid, y: 0 } });
        break;
      }

      case 'custom': {
        throw new Error('not implemented');
      }
    }
  };

  const checkCurrentMultiplier = async (value: string | RegExp) => {
    await expect(page.getByTestId('leverage-slider-current')).toHaveText(value);
  };

  const openMoreOptions = async () => {
    const more = page.getByTestId('leverage-more-options');
    await expect(more).toBeVisible();
    await expect(more).toHaveAttribute('aria-expanded', 'false');

    await page.getByTestId('leverage-more-options-expand').click();

    await expect(page.getByTestId('leverage-more-options')).toHaveAttribute('aria-expanded', 'true');
  };

  const closeMoreOptions = async () => {
    const more = page.getByTestId('leverage-more-options');
    await expect(more).toBeVisible();
    await expect(more).toHaveAttribute('aria-expanded', 'true');

    await page.getByTestId('leverage-more-options-expand').click();

    await expect(more).toHaveAttribute('aria-expanded', 'false');
  };

  const input = async (value: string) => {
    const inp = page.getByTestId('modal-input');
    await expect(inp).toBeVisible();
    await inp.fill(value);
  };

  const goToSummary = async () => {
    await page.getByTestId('leverage-modal-continue').click();
  };

  const acceptRisk = async () => {
    const inp = page.getByTestId('leverage-accept-risk');
    await expect(inp).toBeVisible();

    await inp.click();
    await expect(inp).toBeChecked();
  };

  const goBack = async () => {
    const button = page.getByTestId('leverage-go-back');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();

    await button.click();
  };

  const approve = async () => {
    const button = page.getByTestId('leverage-approve');
    await expect(button).toBeVisible();
    await expect(button).not.toBeDisabled();

    await button.click();
  };

  const submit = async () => {
    const button = page.getByTestId('leverage-submit');
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
    waitForStepToContinue,
    cta,
    open,
    close,
    checkOption,
    selectAsset,
    selectMultiplier,
    checkCurrentMultiplier,
    openMoreOptions,
    closeMoreOptions,
    input,
    goToSummary,
    acceptRisk,
    waitSummaryToBeReady,
    goBack,
    approve,
    submit,
    waitForSkeletons,
    waitForTransaction,
    checkTransactionStatus,
  };
}

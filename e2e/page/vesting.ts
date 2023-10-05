import { Page, expect } from '@playwright/test';

export default function (page: Page) {
  const waitForPageToBeReady = async () => {
    await page.waitForFunction(() => document.querySelectorAll('.MuiSkeleton-root').length === 0, null, {
      timeout: 30_000,
      polling: 1_000,
    });
  };

  const checkBalanceAvailable = async (balance: string | RegExp) => {
    await expect(page.getByTestId('vesting-balance')).toContainText(balance);
  };

  const checkReserveNeeded = async (ratio: string | RegExp, reserve: string | RegExp) => {
    await expect(page.getByTestId('vesting-reserve-ratio')).toContainText(ratio);
    await expect(page.getByTestId('vesting-reserve')).toContainText(reserve);
  };

  const input = async (text: string) => {
    const inp = page.getByTestId('vesting-input');
    await expect(inp).toBeVisible();
    await inp.fill(text);
  };

  const checkError = async (error: string | RegExp) => {
    const container = page.getByTestId('vesting-error');
    await expect(container).toBeVisible();
    await expect(container).toHaveText(error);
  };

  const waitForSubmitToBeReady = async () => {
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="vesting-submit"]');
        if (!button) return true;
        return !button.classList.contains('MuiLoadingButton-loading');
      },
      null,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  const submit = async () => {
    const button = page.getByTestId('vesting-submit');
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForVestTransaction = async () => {
    const modal = page.getByTestId('vesting-vest-modal');
    await expect(modal).toBeVisible();

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

  const closeVestTransaction = async () => {
    const close = page.getByTestId('vesting-vest-modal-close');
    await expect(close).toBeVisible();
    await close.click();
  };

  const checkVestTransactionStatus = async (target: 'success' | 'error', summary: string) => {
    const status = page.getByTestId('transaction-status');

    await expect(status).toHaveText(`Transaction ${target === 'success' ? 'completed' : target}`);
    await expect(page.getByTestId('transaction-summary')).toHaveText(summary);
  };

  type Stream = {
    id: number;
    vested: string | RegExp;
    reserved: string | RegExp;
    withdrawable: string | RegExp;
    left: string | RegExp;
    progress: string | RegExp;
  };

  const checkStream = async (stream: Stream) => {
    const { id, ...props } = stream;
    const row = page.getByTestId(`vesting-stream-${id}`);
    await expect(row).toBeVisible();

    for (const key in props) {
      const el = page.getByTestId(`vesting-stream-${id}-${key}`);
      await expect(el).toBeVisible();
      await expect(el).toContainText(props[key]);
    }
  };

  const claimStream = async (streamId: number) => {
    const button = page.getByTestId(`vesting-stream-${streamId}-claim`);
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForClaimStreamTransaction = async (streamId: number) => {
    await page.waitForFunction(
      (id) => {
        const button = document.querySelector(`[data-testid="vesting-stream-${id}-claim"]`);
        if (!button) return true;
        return !button.classList.contains('MuiLoadingButton-loading');
      },
      streamId,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  const claimAllStreams = async () => {
    const button = page.getByTestId('vesting-claim-all');
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForClaimAllTransaction = async () => {
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="vesting-claim-all"]');
        if (!button) return true;
        return !button.classList.contains('MuiLoadingButton-loading');
      },
      null,
      {
        timeout: 30_000,
        polling: 1_000,
      },
    );
  };

  return {
    waitForPageToBeReady,
    checkBalanceAvailable,
    checkReserveNeeded,
    input,
    checkError,
    waitForSubmitToBeReady,
    submit,
    waitForVestTransaction,
    checkVestTransactionStatus,
    closeVestTransaction,
    checkStream,
    claimStream,
    waitForClaimStreamTransaction,
    claimAllStreams,
    waitForClaimAllTransaction,
  };
}

import { expect, type Page } from '@playwright/test';

export default function (page: Page) {
  const waitForPageToBeReady = async () => {
    await expect(page.locator('.MuiSkeleton-root')).toHaveCount(0);
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
    await expect(page.getByTestId('vesting-submit')).not.toBeDisabled();
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
    await expect(status).toBeVisible();
    await expect(status).not.toHaveText('Processing transaction...');
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
    await expect(async () => {
      if ((await page.getByTestId(`vesting-stream-${streamId}`).count()) === 0) return;
      await expect(page.getByTestId(`vesting-stream-${streamId}-claim`)).toBeEnabled({ timeout: 2_000 });
    }).toPass({ timeout: 66_666 });
  };

  const claimAllStreams = async () => {
    const button = page.getByTestId('vesting-claim-all');
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForClaimAllTransaction = async () => {
    await expect(page.getByTestId('vesting-claim-all')).toHaveCount(0);
  };

  const cancelStream = async (streamId: number) => {
    const button = page.getByTestId(`vesting-stream-${streamId}-cancel`);
    await expect(button).not.toBeDisabled();
    await button.click();

    const confirm = page.getByTestId(`vesting-stream-${streamId}-cancel-submit`);
    await expect(confirm).not.toBeDisabled();
    await confirm.click();
  };

  const waitForStreamCancelTransaction = async (streamId: number) => {
    await expect(page.getByTestId(`vesting-stream-${streamId}-cancel-submit`)).not.toBeVisible();
    await expect(page.getByTestId(`vesting-stream-${streamId}`)).not.toBeVisible();
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
    cancelStream,
    waitForStreamCancelTransaction,
  };
}

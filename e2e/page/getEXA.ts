import { Page, expect } from '@playwright/test';

export default function (page: Page) {
  const waitForPageToBeReady = async () => {
    await page.waitForTimeout(5_000);
    await page.waitForFunction(
      () => {
        const skeletons = document.querySelectorAll('.MuiSkeleton-root').length > 0;
        const submit = document.querySelector('[data-testid="get-exa-submit"]');
        if (!submit || skeletons) return false;
        const attr = submit.getAttribute('disabled');
        return attr === null;
      },
      null,
      { polling: 1_000 },
    );
  };

  const checkView = async (view: 'route' | 'review' | 'tx-status') => {
    await expect(page.getByTestId(`get-exa-view-${view}`)).toBeVisible();
  };

  const checkNetwork = async (network: string) => {
    await expect(page.getByTestId('get-exa-chain')).toContainText(network);
  };

  const checkAsset = async (asset: string) => {
    await expect(page.getByTestId('get-exa-asset')).toContainText(asset);
  };

  const selectAsset = async (asset: string) => {
    const button = page.getByTestId('get-exa-asset');
    await expect(button).toBeVisible();
    await button.click();

    const option = page.getByTestId(`get-exa-asset-${asset}`);
    await expect(option).toBeVisible();
    await option.click();

    await checkAsset(asset);
  };

  const checkBalanceAvailable = async (balance: string | RegExp) => {
    await expect(page.getByTestId('get-exa-balance')).toContainText(balance);
  };

  const input = async (text: string) => {
    const inp = page.getByTestId('get-exa-input');
    await expect(inp).toBeVisible();
    await inp.fill(text);
  };

  const checkRouteVisible = async () => {
    await expect(page.getByTestId('get-exa-route')).toBeVisible();
  };

  const checkDisabledSubmitLabel = async (label: string | RegExp) => {
    const button = page.getByTestId('get-exa-submit');
    await expect(button).toBeDisabled();
    await expect(button).toContainText(label);
  };

  const submit = async () => {
    const button = page.getByTestId('get-exa-submit');
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForSubmitTransaction = async () => {
    const status = page.getByTestId('transaction-status');
    await expect(status).toBeVisible();
    await page.waitForFunction(
      (message) => {
        const text = document.querySelector('[data-testid="transaction-status"]');
        if (!text) return false;
        return text.textContent !== message;
      },
      'Processing transaction...',
      { polling: 1_000 },
    );
  };

  const checkTransactionStatus = async (target: 'success' | 'error') => {
    const status = page.getByTestId('transaction-status');
    await expect(status).toHaveText(`Transaction ${target}`);
  };

  const review = async () => {
    const button = page.getByTestId('get-exa-review');
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const approve = async () => {
    const button = page.getByTestId('get-exa-approve');
    await expect(button).not.toBeDisabled();
    await button.click();
  };

  const waitForApproveTransaction = async () => {
    await page.waitForFunction(
      () => {
        const button = document.querySelector('[data-testid="get-exa-approve"]');
        if (!button) return true;
        return !button.classList.contains('MuiLoadingButton-loading');
      },
      null,
      { polling: 1_000 },
    );
  };

  return {
    waitForPageToBeReady,
    checkView,
    checkNetwork,
    checkAsset,
    selectAsset,
    checkBalanceAvailable,
    input,
    checkRouteVisible,
    checkDisabledSubmitLabel,
    submit,
    waitForSubmitTransaction,
    checkTransactionStatus,
    review,
    approve,
    waitForApproveTransaction,
  };
}

import { Page, expect } from '@playwright/test';

import _modal from '../components/modal';
import { formatMaturity } from '../utils/strings';

export default function (page: Page) {
  const switchTab = async (tab: 'deposit' | 'borrow') => {
    await page.getByTestId(`simple-view-${tab}-tab`).click();
  };

  const tabIsActive = async (tab: 'deposit' | 'borrow') => {
    const locator = page.getByTestId(`simple-view-${tab}-tab`);
    await expect(locator).toHaveAttribute('data-active', 'true', { timeout: 1_000 });
  };

  const checkAction = async (action: string) => {
    await expect(page.getByTestId('simple-view-asset-action')).toHaveText(action);
  };

  const checkOptionExists = async (maturity: number) => {
    await expect(page.getByTestId(`simple-view-maturity-option-${maturity}`)).toBeVisible();
  };

  const selectOption = async (maturity: number) => {
    await page.getByTestId(`simple-view-maturity-option-${maturity}`).click();
  };

  const checkBalanceVisible = async (visible: boolean) => {
    const info = page.getByTestId('modal-amount-info');
    if (visible) {
      await expect(info).toBeVisible();
    } else {
      await expect(info).not.toBeVisible();
    }
  };

  const waitForViewReady = async () => {
    await page.waitForFunction(
      () => {
        return (
          document.querySelector('[data-testid="simple-view"] > div')?.querySelectorAll('.MuiSkeleton-root').length ===
            0 &&
          ['submit', 'approve'].every((action) => {
            const button = document.querySelector(`[data-testid="modal-${action}"]`);
            if (!button) return true;
            return !button.classList.contains('MuiLoadingButton-loading');
          })
        );
      },
      null,
      { timeout: 30_000, polling: 1_000 },
    );
  };

  const checkOverviewVisible = async (visible: boolean) => {
    const overview = page.getByTestId('simple-view-overview');
    if (visible) {
      await expect(overview).toBeVisible();
    } else {
      await expect(overview).not.toBeVisible();
    }
  };

  const checkMaturityDate = async (maturity: number) => {
    const overviewMaturity = page.getByTestId('simple-view-overview-maturity');
    await expect(overviewMaturity).toHaveText(formatMaturity(maturity));
  };

  const { checkAssetSelection, input, checkInput, checkAlert } = _modal(page);

  return {
    switchTab,
    tabIsActive,
    checkAction,
    checkOptionExists,
    selectOption,
    checkBalanceVisible,
    waitForViewReady,
    checkOverviewVisible,
    checkMaturityDate,
    checkAssetSelection,
    input,
    checkInput,
    checkAlert,
  };
}

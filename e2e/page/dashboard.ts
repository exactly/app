import { Page, expect } from '@playwright/test';

import type { ERC20TokenSymbol } from '../utils/contracts';

export default function (page: Page) {
  const checkCollateralSwitchStatus = async (symbol: ERC20TokenSymbol, disabled: boolean, checked: boolean) => {
    const input = page.getByTestId(`switch-collateral-${symbol}`);

    await expect(input).toBeVisible();

    if (disabled) {
      await expect(input).toBeDisabled();
    } else {
      await expect(input).not.toBeDisabled();
    }

    if (checked) {
      await expect(input).toBeChecked();
    } else {
      await expect(input).not.toBeChecked();
    }
  };

  const checkCollateralSwitchTooltip = async (symbol: ERC20TokenSymbol, message: string) => {
    const wrapper = page.getByTestId(`switch-collateral-${symbol}-wrapper`);
    await wrapper.hover();

    const tooltip = page.getByTestId(`switch-collateral-${symbol}-tooltip`);

    await expect(tooltip).toBeVisible();
    await expect(tooltip).toHaveText(message);

    await page.mouse.move(0, 0);
  };

  const checkCollateralSwitchStatusLoading = async (symbol: ERC20TokenSymbol) => {
    const locator = page.getByTestId(`switch-collateral-${symbol}-loading`);
    await expect(locator).toBeVisible();
  };

  const attemptEnterMarket = async (symbol: ERC20TokenSymbol) => {
    await checkCollateralSwitchStatus(symbol, false, false);
    await page.getByTestId(`switch-collateral-${symbol}-wrapper`).hover();
    await page.getByTestId(`switch-collateral-${symbol}`).click();
  };

  const attemptExitMarket = async (symbol: ERC20TokenSymbol) => {
    await checkCollateralSwitchStatus(symbol, false, true);
    await page.getByTestId(`switch-collateral-${symbol}-wrapper`).hover();
    await page.getByTestId(`switch-collateral-${symbol}`).click();
  };

  const switchTab = async (tab: 'deposit' | 'borrow') => {
    const t = page.getByTestId(`tab-${tab}`);
    await expect(t).toBeVisible();
    await t.click();
  };

  const checkFixedTableRow = async (type: 'deposit' | 'borrow', symbol: ERC20TokenSymbol, maturity: number) => {
    const row = page.getByTestId(`dashboard-fixed-${type}-row-${maturity}-${symbol}`);
    await expect(row).toBeVisible();
  };

  const waitForTransaction = async (symbol: ERC20TokenSymbol) => {
    await checkCollateralSwitchStatusLoading(symbol);
    await page.waitForFunction(
      (selector) => document.querySelector(selector) === null,
      `[data-testid="switch-collateral-${symbol}-loading"]`,
      { timeout: 30_000, polling: 1_000 },
    );
  };

  return {
    checkCollateralSwitchStatus,
    checkCollateralSwitchTooltip,
    checkCollateralSwitchStatusLoading,
    attemptEnterMarket,
    attemptExitMarket,
    switchTab,
    checkFixedTableRow,
    waitForTransaction,
  };
}

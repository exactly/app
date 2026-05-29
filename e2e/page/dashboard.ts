import { expect, type Page } from '@playwright/test';

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
    await expect(async () => {
      await t.click();
      await expect(t).toHaveAttribute('aria-selected', 'true', { timeout: 2_000 });
    }).toPass({ timeout: 66_666 });
  };

  const checkFloatingTableRow = async (type: 'deposit' | 'borrow', symbol: ERC20TokenSymbol) => {
    const row = page.getByTestId(`dashboard-floating-${type}-row-${symbol}`);
    await expect(row).toBeVisible();
  };

  const checkFixedTableRow = async (type: 'deposit' | 'borrow', symbol: ERC20TokenSymbol, maturity: number) => {
    const row = page.getByTestId(`dashboard-fixed-${type}-row-${maturity}-${symbol}`);
    await expect(row).toBeVisible();
  };

  const expandFixedTableRow = async (type: 'deposit' | 'borrow', symbol: ERC20TokenSymbol, maturity: number) => {
    const button = page
      .getByTestId(`dashboard-fixed-${type}-row-${maturity}-${symbol}`)
      .getByRole('button', { name: 'expand row' });
    const transactions = page.getByTestId('dashboard-fixed-transactions').first();
    if (!(await transactions.isVisible().catch(() => false))) {
      await button.click();
    }
    await expect(transactions).toBeVisible();
  };

  const checkFixedTransaction = async (operation: 'borrow' | 'deposit' | 'repay' | 'withdraw') => {
    await expect(page.getByTestId(`dashboard-fixed-transaction-${operation}`).first()).toBeVisible();
  };

  const waitForTransaction = async (symbol: ERC20TokenSymbol) => {
    await expect(page.getByTestId(`switch-collateral-${symbol}-loading`)).not.toBeVisible();
  };

  return {
    checkCollateralSwitchStatus,
    checkCollateralSwitchTooltip,
    attemptEnterMarket,
    attemptExitMarket,
    switchTab,
    checkFloatingTableRow,
    checkFixedTableRow,
    expandFixedTableRow,
    checkFixedTransaction,
    waitForTransaction,
  };
}

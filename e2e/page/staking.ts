import { expect, type Page } from '@playwright/test';

export default (page: Page) => {
  const transaction = async () => {
    const status = page.getByTestId('transaction-status');
    await expect(status).toBeVisible();
    await expect(status).toHaveText('Transaction completed');
  };

  return {
    available: () => page.getByTestId('staking-balance'),
    staked: () => page.getByTestId('staking-staked'),

    waitForReady: () => expect(page.getByTestId('staking-submit')).toBeVisible(),

    stake: async (amount: string) => {
      await page.getByTestId('staking-input').fill(amount);
      await page.getByTestId('staking-submit').click();
      await transaction();
    },

    closeTransaction: () => page.getByTestId('staking-modal-close').click(),

    withdraw: async (amount: string) => {
      await page.getByRole('button', { name: 'Early Withdraw' }).click();
      const modal = page.getByTestId('staking-modal');
      await expect(modal).toBeVisible();
      await modal.getByTestId('staking-input').fill(amount);
      await modal.getByTestId('staking-submit').click();
      await transaction();
    },

    claim: async () => {
      const button = page.getByRole('button', { name: 'Claim rewards to date' });
      await expect(button).toBeEnabled();
      await button.click();
      await transaction();
    },
  };
};

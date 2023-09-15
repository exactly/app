import { type Page, expect } from '@playwright/test';
import type { Address } from 'viem';

export default function (page: Page) {
  const connectedWallet = async (address: Address) => {
    const addr = page.getByTestId('user-address');
    await expect(addr).toBeVisible();
    await expect(addr).toContainText(address.substring(0, 6));
    await expect(addr).toContainText(address.substring(38));
  };

  return { connectedWallet };
}

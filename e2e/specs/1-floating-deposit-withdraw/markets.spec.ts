import { expect } from '@playwright/test';
import { createWalletClient, http } from 'viem';
import { anvil } from 'viem/chains';

import base from '../../fixture/base';
import { marketAbi, marketUsdcAddress } from '../../../generated/wagmi';

const test = base();

for (const pools of [0, 1, 2]) {
  test(`markets render with ${pools} fixed pools`, async ({ page, web2, web3 }) => {
    await web3.publicClient.waitForTransactionReceipt({
      hash: await createWalletClient({ chain: anvil, transport: http(web3.anvil.url()) }).writeContract({
        abi: marketAbi,
        address: marketUsdcAddress[anvil.id],
        functionName: 'setMaxFuturePools',
        args: [pools],
        account: '0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266',
        chain: anvil,
      }),
    });
    await web2.time.now(
      Number(((await web3.publicClient.getBlock()).timestamp / 2_419_200n + 1n) * 2_419_200n - 86_400n),
    );

    await page.goto('/');

    await expect(page.getByTestId('markets-pool-row-USDC')).toBeVisible();
    await expect(page.getByTestId('markets-pool-row-USDC').locator('.MuiSkeleton-root')).toHaveCount(0);
    await expect(page.getByRole('heading', { name: /Application error/ })).toHaveCount(0);
    await page
      .getByTestId('markets-pool-row-USDC')
      .getByTestId(/borrow-USDC$/)
      .click();
    await expect(page.getByTestId(`modal-type-switch-${pools < 2 ? 'variable' : 'fixed'}`)).toHaveAttribute(
      'aria-selected',
      'true',
    );
  });
}

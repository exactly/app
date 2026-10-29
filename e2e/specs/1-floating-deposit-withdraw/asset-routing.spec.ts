import { expect } from '@playwright/test';
import { encodeFunctionResult, zeroAddress } from 'viem';
import { anvil } from 'viem/chains';

import base from '../../fixture/base';
import { previewerAbi, previewerAddress } from '../../../generated/wagmi';

const test = base();

for (const pools of [0, 3]) {
  test(`new onchain markets with ${pools} fixed pools work without a protocol package update`, async ({
    page,
    web2,
    web3,
  }) => {
    void web2;
    const result = encodeFunctionResult({
      abi: previewerAbi,
      functionName: 'exactly',
      result: (
        await web3.publicClient.readContract({
          abi: previewerAbi,
          address: previewerAddress[anvil.id],
          functionName: 'exactly',
          args: [zeroAddress],
        })
      ).map((market) =>
        market.assetSymbol === 'USDC'
          ? {
              ...market,
              assetSymbol: 'wARS',
              symbol: 'exawARS',
              maxFuturePools: pools,
              fixedPools: market.fixedPools.slice(0, pools),
            }
          : market,
      ),
    });
    await page.route(
      (url) => url.href.startsWith(web3.anvil.url()),
      async (route) => {
        const request = JSON.parse(route.request().postData() ?? '{}');
        if (
          request.method === 'eth_call' &&
          request.params?.[0]?.to?.toLowerCase() === previewerAddress[anvil.id].toLowerCase()
        ) {
          return route.fulfill({ json: { jsonrpc: '2.0', id: request.id, result } });
        }
        return route.continue();
      },
    );

    expect((await page.goto('/wARS'))?.status()).toBe(200);
    await expect(page.getByTestId('floating-pool-column')).toBeVisible();
    await expect(page.getByTestId('maturity-pool-column')).toHaveCount(pools === 0 ? 0 : 1);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toHaveCount(0);

    await page.goto('/');
    await page.getByTestId('markets-pool-row-wARS').getByText('wARS', { exact: true }).click();
    await expect(page).toHaveURL(/\/wARS$/);
    await expect(page.getByTestId('floating-pool-column')).toBeVisible();

    expect((await page.reload())?.status()).toBe(200);
    await expect(page.getByTestId('floating-pool-column')).toBeVisible();
    await expect(page.getByTestId('maturity-pool-column')).toHaveCount(pools === 0 ? 0 : 1);
    await expect(page.getByRole('heading', { name: 'Page Not Found' })).toHaveCount(0);
  });
}

test('unlisted asset routes show the not-found page', async ({ page, web2, web3 }) => {
  void web2;
  void web3;
  await page.goto('/not-a-market');
  await expect(page.getByRole('heading', { name: 'Page Not Found' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Go to Markets' })).toBeVisible();
});

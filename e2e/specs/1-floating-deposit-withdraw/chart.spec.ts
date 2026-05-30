import { expect } from '@playwright/test';
import { encodeFunctionResult } from 'viem';
import { anvil } from 'viem/chains';

import base from '../../fixture/base';
import { marketWethAddress, ratePreviewerAbi, ratePreviewerAddress } from '../../../generated/wagmi';

const test = base();

test('Historical rate chart renders deposit & borrow lines from RatePreviewer reads', async ({ page, web2, web3 }) => {
  void web2; // stub the subgraph empty so the chart can only come from on-chain reads

  const ratePreviewer = ratePreviewerAddress[anvil.id].toLowerCase();
  const now = Math.floor(Date.now() / 1_000);
  const snapshot = encodeFunctionResult({
    abi: ratePreviewerAbi,
    functionName: 'snapshot',
    result: [
      {
        market: marketWethAddress[anvil.id],
        floatingDebt: 200n * 10n ** 18n,
        floatingBackupBorrowed: 0n,
        pools: [],
        floatingAssets: 1000n * 10n ** 18n,
        treasuryFeeRate: 0n,
        earningsAccumulator: 0n,
        earningsAccumulatorSmoothFactor: 2n * 10n ** 18n,
        lastFloatingDebtUpdate: now,
        lastAccumulatorAccrual: now,
        maxFuturePools: 3,
        interval: 2_419_200n,
        totalAssets: 1000n * 10n ** 18n,
        floatingRate: 5n * 10n ** 16n, // 5% borrow APR -> ~1% deposit APR at this utilization
      },
    ],
  });

  // serve the historical RatePreviewer.snapshot() reads (the state-override calls) so the chart has data to
  // plot; every other RPC (the previewer marketAccount, block reads) still hits the real anvil node.
  await page.route(
    (url) => url.href.startsWith(web3.anvil.url()),
    async (route) => {
      const request = JSON.parse(route.request().postData() ?? '{}');
      if (
        request.method === 'eth_call' &&
        request.params?.[0]?.to?.toLowerCase() === ratePreviewer &&
        request.params?.[2]
      ) {
        return route.fulfill({ json: { jsonrpc: '2.0', id: request.id, result: snapshot } });
      }
      return route.continue();
    },
  );

  await page.goto('/WETH');

  const chart = page.getByTestId('historical-rate-chart');
  await expect(chart.getByText('Loading data...')).toBeHidden({ timeout: 20_000 });
  // the LineChart itself must render — this is exactly what regressed when recharts blanked every chart.
  await expect(chart.locator('svg.recharts-surface')).toBeVisible();
  await expect(chart.locator('.recharts-line-curve')).toHaveCount(2); // deposit + borrow

  // hovering must show the custom tooltip with the served rates (regression-guards the TooltipChart crash).
  await chart.locator('svg.recharts-surface').hover();
  await expect(chart.getByText(/Borrow APR:\s*5\.00%/)).toBeVisible();
});

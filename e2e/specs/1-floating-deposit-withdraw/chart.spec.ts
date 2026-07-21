import { expect } from '@playwright/test';
import { encodeFunctionResult } from 'viem';
import { anvil } from 'viem/chains';

import base from '../../fixture/base';
import { marketWethAddress, ratePreviewerAbi, ratePreviewerAddress } from '../../../generated/wagmi';

const test = base();

test('asset macro columns keep their size while skeletons resolve', async ({ page, web2, web3 }) => {
  void web2;
  await page.route(
    (url) => url.href.startsWith(web3.anvil.url()),
    async (route) => {
      await new Promise((resolve) => setTimeout(resolve, 250));
      await route.continue();
    },
  );

  const navigation = page.goto('/WETH');
  await expect(page.locator('.MuiSkeleton-root').first()).toBeVisible();
  const floating = page.getByTestId('floating-pool-column');
  const maturity = page.getByTestId('maturity-pool-column');
  const loadingFloatingBox = await floating.boundingBox();
  const loadingMaturityBox = await maturity.boundingBox();
  expect(loadingFloatingBox?.width).toBe(loadingMaturityBox?.width);

  await navigation;
  await expect(page.locator('.MuiSkeleton-root')).toHaveCount(0);
  const loadedFloatingBox = await floating.boundingBox();
  const loadedMaturityBox = await maturity.boundingBox();
  expect(loadedFloatingBox?.width).toBe(loadedMaturityBox?.width);
  expect(Math.abs((loadingFloatingBox?.height ?? 0) - (loadedFloatingBox?.height ?? 0))).toBeLessThan(4);
  expect(Math.abs((loadingMaturityBox?.height ?? 0) - (loadedMaturityBox?.height ?? 0))).toBeLessThan(4);
});

test('Historical rate chart renders rates and total deposits from RatePreviewer reads', async ({
  page,
  web2,
  web3,
}) => {
  void web2; // register the web2 route mocks (socket/time)
  const chartWarnings: string[] = [];
  page.on('console', (message) => {
    if (message.text().includes('The width(')) chartWarnings.push(message.text());
  });
  let delayHistoricalReads = false;
  let historicalReads = 0;

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
        totalAssets: 1234n * 10n ** 18n,
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
        historicalReads += 1;
        if (delayHistoricalReads) await new Promise((resolve) => setTimeout(resolve, 250));
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
  await expect(chart.getByLabel('Show total deposits')).toBeChecked();
  await expect(chart.getByText('2W', { exact: true })).toBeVisible();
  await expect(chart.locator('.recharts-line-curve')).toHaveCount(3); // deposit APR + borrow APR + total deposits
  const legend = chart.getByTestId('historical-rate-chart-legend');
  await expect(legend.getByText('Deposit APR', { exact: true })).toBeVisible();
  await expect(legend.getByText('Borrow APR', { exact: true })).toBeVisible();
  await expect(legend.getByText('Total Deposits', { exact: true })).toBeVisible();
  expect(await chart.locator('.recharts-cartesian-grid-horizontal line').count()).toBeGreaterThanOrEqual(4);
  expect(
    (await chart.locator('.recharts-yAxis text').allTextContents()).every((value) => !/\.\d*0(?=\D*$)/.test(value)),
  ).toBe(true);

  // hovering must show the custom tooltip with the served rates and deposits.
  await chart.locator('svg.recharts-surface').hover();
  const depositApr = chart.getByText(/^Deposit APR:/);
  const borrowApr = chart.getByText(/Borrow APR:\s*5\.00%/);
  const totalDeposits = chart.getByText(/Total Deposits:\s*1\.234k WETH/);
  await expect(depositApr).toBeVisible();
  await expect(borrowApr).toBeVisible();
  await expect(totalDeposits).toBeVisible();
  await expect(chart.locator('.recharts-tooltip-wrapper .MuiTypography-subtitle2')).not.toHaveText(/\d{2}:\d{2}$/);
  expect((await depositApr.boundingBox())?.y).toBeLessThan((await borrowApr.boundingBox())?.y ?? 0);
  expect((await borrowApr.boundingBox())?.y).toBeLessThan((await totalDeposits.boundingBox())?.y ?? 0);

  delayHistoricalReads = true;
  await chart.getByText('2W', { exact: true }).click();
  await expect(chart.getByText('Loading data...')).toBeVisible();
  await expect(chart.getByTestId('loading-chart')).toHaveCSS('position', 'absolute');
  expect(await chart.locator('.recharts-line-curve').count()).toBe(3);
  await expect(chart.getByText('Loading data...')).toBeHidden({ timeout: 20_000 });
  await chart.locator('svg.recharts-surface').hover();
  await expect(chart.locator('.recharts-tooltip-wrapper .MuiTypography-subtitle2')).toHaveText(/\d{2}:\d{2}$/);
  const twoWeekPoints = Number(await chart.getAttribute('data-point-count'));
  expect(await chart.locator('.recharts-yAxis').first().locator('text').allTextContents()).not.toContain('0%');
  expect(await chart.locator('.recharts-yAxis').last().locator('text').allTextContents()).not.toContain('0');
  expect(
    await chart
      .getByLabel('Show total deposits')
      .locator('..')
      .evaluate((element) => getComputedStyle(element).paddingBottom),
  ).toBe('0px');

  historicalReads = 0;
  await chart.getByText('All', { exact: true }).click();
  await expect(chart.getByText('Loading data...')).toBeVisible();
  await expect(chart.getByText('Loading data...')).toBeHidden({ timeout: 20_000 });
  expect(Number(await chart.getAttribute('data-point-count'))).toBeGreaterThanOrEqual(twoWeekPoints);
  expect(historicalReads).toBeLessThanOrEqual(64);
  expect(chartWarnings).toEqual([]);
});

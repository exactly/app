# Historical Deposit Rates De-Subgraph Implementation Plan

**Goal:** Replace the subgraph-backed historical variable-rate chart with on-chain `MarketUpdate` event reads, so the chart works on every deploy target (including Base, currently broken) with no The Graph dependency.

**Architecture:** Inline a `useContractEvents({ eventName: 'MarketUpdate' })` query directly into `HistoricalRateChart`. Its `select` computes the **realized** deposit/borrow APR and utilization as the proportional growth of share value (`floatingAssets/floatingDepositShares`, `floatingDebt/floatingBorrowShares`) between consecutive events, plotted at raw event timestamps. The `useHistoricalRates` hook and `queryRates.ts` utility are deleted; the subgraph survives only for its remaining consumers (RiskFeed, Sablier, timelock).

**Tech Stack:** React, TypeScript, wagmi/viem (`useContractEvents`, `useBlockNumber`), recharts, `@exactly/lib` (`WAD`), MUI, Playwright + anvil (e2e).

---

## Design decisions already locked (do not re-litigate)

These came out of a grilling session; the plan implements them as-is:

1. **Semantics:** realized rate from `MarketUpdate` snapshots — no `totalAssets()`/IRM/backup-borrowed/treasury reconstruction.
2. **X-axis:** one point per `MarketUpdate` event; APR between consecutive events (irregular time axis ⇒ `XAxis type="number" scale="time"`).
3. **Noise:** ship raw adjacent-event APR; **no** smoothing yet. Drop `apy` (unused by the chart and overflows for tiny gaps).
4. **Fetch:** single `useContractEvents` call, `fromBlock` estimated by block-time (anvil → `0n`), no chunking. Fetch only the selected window.
5. **Scope:** all targets (OP 10, Base 8453, op-sepolia 11155420, base-sepolia 84532, anvil 31337).
6. **Testing:** e2e render-guard on anvil; strip the dead rate stubs from `e2e/fixture/graph.ts`; no new test framework.
7. **UX states:** keep `LoadingChart`; local empty state for `<2` points; reuse the global snackbar with **source-agnostic** reworded copy.
8. **Data-layer shape:** inline into the chart; delete `useHistoricalRates.ts` + `queryRates.ts`; `scopeKey: \`${symbol}-${range}\``, `staleTime: 60_000`.

**Known follow-up (not in scope):** if a busy market's 3-month window exceeds Alchemy's 10k-log `eth_getLogs` cap, the query errors and the snackbar shows — that is the agreed trigger to add range-chunking later. Verify in Task 4.

---

## File Structure

- **Modify** `components/charts/HistoricalRateChart/index.tsx` — becomes self-contained: holds `range` state, runs the inline `useContractEvents` query + `select` transform, renders loading / empty / chart. (Full replacement in Task 1.)
- **Modify** `e2e/fixture/graph.ts` — drop the rate-entity stub branch from the `subgraphs/exactly` route; keep `accounts`/`timelockControllerCalls`. (Task 1.)
- **Create** `e2e/specs/1-floating-deposit-withdraw/chart.spec.ts` — render guard: the chart leaves its loading state on anvil with no subgraph. (Task 1.)
- **Delete** `hooks/useHistoricalRates.ts` — single consumer removed. (Task 2.)
- **Delete** `utils/queryRates.ts` — single consumer removed. (Task 2.)
- **Modify** `contexts/GlobalErrorContext.tsx` — reword `setIndexerError` copy to be source-agnostic, drop the `status.thegraph.com` `Link`. (Task 3.)

Untouched on purpose: `hooks/useGraphClient.ts`, `components/RiskFeed/api`, `config/networkData.json`, Sablier/timelock queries.

---

### Task 1: Migrate the chart to on-chain `MarketUpdate` events (TDD red → green)

**Files:**
- Modify: `e2e/fixture/graph.ts:11-71`
- Create: `e2e/specs/1-floating-deposit-withdraw/chart.spec.ts`
- Modify: `components/charts/HistoricalRateChart/index.tsx` (full replacement)

- [ ] **Step 1: Write the failing test — strip rate stubs and add the render-guard spec**

First, replace the `subgraphs/exactly` route block in `e2e/fixture/graph.ts` (the `void page.route(/127\.0\.0\.1:31337\/subgraphs\/exactly/, ...)` block, currently lines 11-71) with this minimal version (keep everything else in the file unchanged):

```ts
  void page.route(/127\.0\.0\.1:31337\/subgraphs\/exactly/, async (route) => {
    await route.fulfill({ json: { data: { accounts: [], timelockControllerCalls: [] } } });
  });
```

Then create `e2e/specs/1-floating-deposit-withdraw/chart.spec.ts`:

```ts
import { expect } from '@playwright/test';

import base from '../../fixture/base';

const test = base();

test('Historical rate chart loads from on-chain events without a subgraph', async ({ page, web2 }) => {
  void web2; // register socket/graph route interception so no real network calls are made

  await page.goto('/WETH');

  await expect(page.getByText('Historical Variable Rates')).toBeVisible();
  // chart must resolve out of its loading state (to either data or the empty state),
  // proving it no longer depends on the (now stubbed-empty) subgraph
  await expect(page.getByText('Loading data...')).toBeHidden({ timeout: 20_000 });
});
```

- [ ] **Step 2: Run the test to verify it fails**

Run: `pnpm test e2e/specs/1-floating-deposit-withdraw/chart.spec.ts`
Expected: FAIL. With the stubs stripped, the still-subgraph-based `queryRates` reads `response[...][0]` on `undefined`, throws, is caught → `emptyBatch` → `getRates`'s `rs.length === 0` early-return never calls `setLoading(false)` → `Loading data...` stays visible → `toBeHidden` times out after 20s.
(Note: `pnpm test` rebuilds the e2e app + boots anvil first; allow several minutes.)

- [ ] **Step 3: Write the implementation — replace `HistoricalRateChart` with the inline event query**

Replace the **entire contents** of `components/charts/HistoricalRateChart/index.tsx` with:

```tsx
import { Box, Checkbox, FormControlLabel, Typography, useTheme } from '@mui/material';
import React, { FC, useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { formatUnits } from 'viem';
import { useBlockNumber, useContractEvents } from 'wagmi';
import { WAD } from '@exactly/lib';

import { marketAbi } from 'generated/wagmi';
import useAccountData from 'hooks/useAccountData';
import { useGlobalError } from 'contexts/GlobalErrorContext';
import { defaultChain } from 'utils/client';
import { toPercentage } from 'utils/utils';
import { track } from 'utils/mixpanel';
import ButtonsChart from '../ButtonsChart';
import LoadingChart from '../LoadingChart';
import TooltipChart from '../TooltipChart';

type Props = {
  symbol: string;
};

type Range = '1W' | '1M' | '3M';

const WINDOW_SECONDS: Record<Range, number> = { '1W': 7 * 86_400, '1M': 30 * 86_400, '3M': 90 * 86_400 };
const SECONDS_PER_BLOCK: Record<number, number> = { 1: 12, 10: 2, 8453: 2, 11_155_420: 2, 84_532: 2 };

const HistoricalRateChart: FC<Props> = ({ symbol }) => {
  const { t } = useTranslation();
  const { palette } = useTheme();
  const { setIndexerError } = useGlobalError();
  const [showUtilization, setShowUtilization] = useState(false);
  const [range, setRange] = useState<Range>('1W');

  const { marketAccount } = useAccountData(symbol);
  const market = marketAccount?.market;

  const { data: blockNumber } = useBlockNumber({ chainId: defaultChain.id });

  const fromBlock = useMemo(() => {
    if (defaultChain.id === 31_337) return 0n;
    if (blockNumber === undefined) return undefined;
    const span = BigInt(Math.ceil((WINDOW_SECONDS[range] / (SECONDS_PER_BLOCK[defaultChain.id] ?? 2)) * 1.1));
    return blockNumber > span ? blockNumber - span : 0n;
  }, [blockNumber, range]);

  const {
    data: points = [],
    isLoading,
    isError,
  } = useContractEvents({
    address: market,
    abi: marketAbi,
    eventName: 'MarketUpdate',
    strict: true,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    scopeKey: `${symbol}-${range}`,
    query: {
      enabled: Boolean(market) && fromBlock !== undefined,
      staleTime: 60_000,
      select: (logs) => {
        const cutoff = Math.floor(Date.now() / 1_000) - WINDOW_SECONDS[range];
        const states = [...logs]
          .sort((a, b) =>
            a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : Number(a.blockNumber - b.blockNumber),
          )
          .map(({ args }) => args)
          .filter(({ timestamp }) => Number(timestamp) >= cutoff);
        const byTimestamp = new Map(states.map((state) => [Number(state.timestamp), state]));
        const sorted = [...byTimestamp.values()].sort((a, b) => Number(a.timestamp - b.timestamp));
        return sorted.slice(1).map((state, i) => {
          const prev = sorted[i];
          const dt = Number(state.timestamp - prev.timestamp);
          const depositValue = state.floatingDepositShares
            ? (state.floatingAssets * WAD) / state.floatingDepositShares
            : WAD;
          const prevDepositValue = prev.floatingDepositShares
            ? (prev.floatingAssets * WAD) / prev.floatingDepositShares
            : WAD;
          const borrowValue = state.floatingBorrowShares
            ? (state.floatingDebt * WAD) / state.floatingBorrowShares
            : WAD;
          const prevBorrowValue = prev.floatingBorrowShares
            ? (prev.floatingDebt * WAD) / prev.floatingBorrowShares
            : WAD;
          return {
            date: Number(state.timestamp) * 1_000,
            depositApr: (Number(formatUnits((depositValue * WAD) / prevDepositValue, 18)) - 1) * (31_536_000 / dt),
            borrowApr: (Number(formatUnits((borrowValue * WAD) / prevBorrowValue, 18)) - 1) * (31_536_000 / dt),
            utilization: state.floatingAssets
              ? Number(formatUnits((state.floatingDebt * WAD) / state.floatingAssets, 18))
              : 0,
          };
        });
      },
    },
  });

  useEffect(() => {
    if (isError) setIndexerError();
  }, [isError, setIndexerError]);

  const buttons = useMemo(
    () => [
      { label: t('1W'), onClick: () => setRange('1W') },
      { label: t('1M'), onClick: () => setRange('1M') },
      { label: t('3M'), onClick: () => setRange('3M') },
    ],
    [t],
  );

  const formatDate = useCallback(
    (date: Date, year?: boolean) =>
      date.toLocaleDateString('en-us', { year: year ? 'numeric' : undefined, month: 'short', day: '2-digit' }),
    [],
  );

  const onShowUtilizationChange = useCallback(() => {
    setShowUtilization((prev) => !prev);
    track('Option Selected', {
      name: 'show utilization',
      location: 'Historical Rate Chart',
      symbol,
      value: !showUtilization,
      prevValue: showUtilization,
    });
  }, [showUtilization, symbol]);

  return (
    <Box display="flex" flexDirection="column" width="100%" height="100%" gap={2}>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="h6" fontSize="16px">
          {t('Historical Variable Rates')}
        </Typography>
        <Box>
          <ButtonsChart buttons={buttons} />
        </Box>
      </Box>
      <ResponsiveContainer width="100%" height="100%">
        {isLoading ? (
          <LoadingChart />
        ) : points.length < 2 ? (
          <Box display="flex" width="100%" height="100%" alignItems="center" justifyContent="center">
            <Typography color="grey.500" variant="subtitle2" fontSize="14px">
              {t('Not enough variable rate activity to chart yet.')}
            </Typography>
          </Box>
        ) : (
          <LineChart data={points} margin={{ top: 5, bottom: 5 }}>
            <CartesianGrid horizontal vertical={false} stroke={palette.grey[300]} />
            <XAxis
              dataKey="date"
              type="number"
              scale="time"
              domain={['dataMin', 'dataMax']}
              minTickGap={50}
              padding={{ left: 20, right: 30 }}
              tickFormatter={(value) => formatDate(new Date(value as number))}
              stroke="#B4BABF"
              fontSize="12px"
              height={20}
            />
            <YAxis
              yAxisId="left"
              tickFormatter={(tick) => toPercentage(tick)}
              axisLine={false}
              tick={{ fill: palette.grey[500], fontWeight: 500, fontSize: 11 }}
              tickLine={false}
              width={50}
            />
            {showUtilization && (
              <YAxis
                yAxisId="right"
                orientation="right"
                tickFormatter={(value) => `${((value as number) * 100).toFixed(2)}%`}
                tick={{ fill: palette.blue, fontWeight: 500, fontSize: 11 }}
                axisLine={false}
                tickLine={false}
                width={50}
              />
            )}
            <Tooltip
              labelFormatter={(value) => formatDate(new Date(value as number), true)}
              formatter={(value) => toPercentage(value as number)}
              content={<TooltipChart itemSorter={(a, b) => (a.value > b.value ? -1 : 1)} />}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="depositApr"
              name={t('Deposit APR')}
              stroke={palette.mode === 'light' ? 'black' : 'white'}
              dot={false}
              strokeWidth={2}
            />
            <Line
              yAxisId="left"
              type="monotone"
              dataKey="borrowApr"
              name={t('Borrow APR')}
              stroke={palette.green}
              dot={false}
              strokeWidth={2}
            />
            {showUtilization && (
              <Line
                yAxisId="right"
                type="monotone"
                dataKey="utilization"
                name={t('Utilization Rate')}
                stroke={palette.blue}
                dot={false}
                strokeDasharray="5 5"
              />
            )}
          </LineChart>
        )}
      </ResponsiveContainer>
      <Box display="flex" alignItems="center" mt={-2.5} pl={1}>
        <FormControlLabel
          control={
            <Checkbox
              size="small"
              onChange={onShowUtilizationChange}
              sx={{ color: palette.blue, '&.Mui-checked': { color: palette.blue } }}
            />
          }
          label={
            <Typography variant="subtitle1" fontSize="12px">
              {t('Show utilization')}
            </Typography>
          }
        />
      </Box>
    </Box>
  );
};

export default React.memo(HistoricalRateChart);
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `pnpm test e2e/specs/1-floating-deposit-withdraw/chart.spec.ts`
Expected: PASS. On anvil, `fromBlock` is `0n`, the chart reads `MarketUpdate` events (0, 1, or more). With `<2` events it shows the empty state; otherwise it draws lines. Either way `Loading data...` disappears and the heading is visible. No console errors (the empty state renders a plain `Box`, never recharts with empty data).

---

### Task 2: Delete the now-dead subgraph hook and query

**Files:**
- Delete: `hooks/useHistoricalRates.ts`
- Delete: `utils/queryRates.ts`

- [ ] **Step 1: Confirm there are no remaining importers**

Run: `grep -rn "useHistoricalRates\|queryRates" --include="*.ts" --include="*.tsx" . --exclude-dir=node_modules`
Expected: only the two files themselves appear (no other importers — `HistoricalRateChart` no longer imports them after Task 1).

- [ ] **Step 2: Delete the files**

```bash
git rm hooks/useHistoricalRates.ts utils/queryRates.ts
```

- [ ] **Step 3: Run the full check to verify nothing is broken**

Run: `pnpm check`
Expected: PASS. `check:lint` (eslint, max-warnings=0) finds no dangling imports; `check:deps` (knip) reports no unused files/deps for the deletions; `check:build` (next build) type-checks and compiles. (`graphql-request` and `@exactly/lib` stay — still used by `useGraphClient` and other code.)

---

### Task 3: Reword the global error copy to be source-agnostic

**Files:**
- Modify: `contexts/GlobalErrorContext.tsx:2` (import) and `:25-44` (`setIndexerError` body)

This method is shared with `useGraphClient` (subgraph) and now the chart's RPC `getLogs`, so the copy must not name The Graph.

- [ ] **Step 1: Remove the now-unused `Link` import**

Replace line 2:

```tsx
import { Alert, IconButton, Link, Slide, SlideProps, Snackbar, Typography } from '@mui/material';
```

with:

```tsx
import { Alert, IconButton, Slide, SlideProps, Snackbar, Typography } from '@mui/material';
```

- [ ] **Step 2: Reword `setIndexerError`**

Replace the `setIndexerError` callback (currently lines 25-44):

```tsx
  const setIndexerError = useCallback(() => {
    setError(
      <Typography>
        <Trans
          i18nKey="Whoops! Our <1>indexer node</1> is currently experiencing issues and some information may not be displayed."
          components={{
            1: (
              <Link
                href="https://status.thegraph.com/"
                target="_blank"
                rel="noopener noreferrer"
                style={{ textDecoration: 'none' }}
                sx={{ color: 'blue' }}
              />
            ),
          }}
        />
      </Typography>,
    );
  }, []);
```

with:

```tsx
  const setIndexerError = useCallback(() => {
    setError(
      <Typography>
        <Trans i18nKey="Whoops! We're having trouble loading some data right now. Please try again shortly." />
      </Typography>,
    );
  }, []);
```

- [ ] **Step 3: Run the full check**

Run: `pnpm check`
Expected: PASS. No unused `Link` import; `Trans` and `Typography` remain used. The new i18n key falls back to its English text in all locales (only `es` is scanned, and a missing key falls back to the key string) — **do not run `pnpm i18n:scan`**, which would inject `__STRING_NOT_TRANSLATED__` into `i18n/es/translation.json`.

- [ ] **Step 4: Commit**

```bash
git add contexts/GlobalErrorContext.tsx
git commit -m "chore: make global data-error copy source-agnostic"
```

---

### Task 4: Final verification (automated + manual)

**Files:** none (verification only)

- [ ] **Step 1: Run the full automated suite**

Run: `pnpm check && pnpm test`
Expected: PASS. Lint + knip + build clean; the full Playwright suite (including the existing `/WETH`, `/OP`, `/USDC` specs that now render the event-based chart, plus the new `chart.spec.ts`) is green with no console errors.

- [ ] **Step 2: Manual check on a real chain (the only way to validate real values, per the "ship raw, smooth when we see the need" decision)**

Run: `NEXT_PUBLIC_NETWORK=10 NEXT_PUBLIC_ALCHEMY_API_KEY=<key> pnpm dev`
Then open a busy market (e.g. `http://localhost:3000/USDC`) and verify:
- The chart draws deposit (black/white) and borrow (green) APR lines at irregular x-positions matching on-chain activity.
- Toggling **1W / 1M / 3M** refetches and changes the window.
- The **Show utilization** toggle adds the dashed blue line on the right axis.
- **3M on the busiest market does not error** (no red snackbar). If it does, the Alchemy 10k-log cap was hit → open the agreed follow-up to add `getLogs` range-chunking (out of scope here).

- [ ] **Step 3: Confirm Base is fixed**

Run: `NEXT_PUBLIC_NETWORK=8453 NEXT_PUBLIC_ALCHEMY_API_KEY=<key> pnpm dev`
Open a Base market page and confirm the chart now resolves (data or empty state) instead of spinning forever — Base had no subgraph entry, so this is a net new capability.

---

## Self-Review

**1. Spec coverage** — every locked decision maps to a task: semantics + raw-event x-axis + dropped `apy` + fetch strategy + scope (per-chain `SECONDS_PER_BLOCK`, anvil `0n`) → Task 1 chart code; testing + stub removal → Task 1 spec/graph.ts; delete hook+util → Task 2; UX error copy + empty state (empty state is in Task 1's render) → Task 1 & Task 3; cap follow-up flagged → Task 4. No decision is unimplemented.

**2. Placeholder scan** — no TBD/TODO; every code step contains the full file or exact old→new replacement; the `<key>` token in Task 4 is a real runtime secret the operator supplies, not a code placeholder.

**3. Type consistency** — `range: Range` and `setRange` are used consistently; `WINDOW_SECONDS`/`SECONDS_PER_BLOCK` keyed types match their lookups; `points` is the `select` return type with fields `date`(number ms), `depositApr`, `borrowApr`, `utilization`, all consumed by matching recharts `dataKey`s and the `<2` empty-state guard; `marketAccount?.market` (`Address | undefined`) is gated by `enabled`; `MarketUpdate` `strict: true` args (`timestamp`, `floatingDepositShares`, `floatingAssets`, `floatingBorrowShares`, `floatingDebt`) are all `bigint`, matching the BigInt math. The reworded `setIndexerError` keeps its `() => void` signature, so `useGraphClient`'s call site is unaffected.

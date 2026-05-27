import { test, type Page } from '@playwright/test';
import { type Address } from 'viem';

function graph(page: Page) {
  let streamBody: Stream[] = [];

  void page.route(/(sablier-labs\/sablier-v2-optimism|127\.0\.0\.1:31337\/subgraphs\/sablier)/, async (route) => {
    await route.fulfill({ json: { data: { streams: streamBody } } });
  });

  void page.route(/127\.0\.0\.1:31337\/subgraphs\/exactly/, async (route) => {
    const query = String(JSON.parse(route.request().postData() || '{}').query ?? '');
    const data = Object.fromEntries(
      [
        ...query.matchAll(
          /([A-Za-z0-9_]+):\s*(marketUpdates|floatingDebtUpdates|interestRateModelSets|accumulatorAccruals|earningsAccumulatorSmoothFactorSets|treasurySets|fixedEarningsUpdates)/g,
        ),
      ].map(([, alias, field]) => [
        alias,
        field === 'marketUpdates'
          ? [
              {
                timestamp: Math.floor(Date.now() / 1_000),
                floatingDepositShares: '0',
                floatingAssets: '0',
                floatingBorrowShares: '0',
                floatingDebt: '0',
                earningsAccumulator: '0',
                floatingBackupBorrowed: '0',
              },
            ]
          : field === 'floatingDebtUpdates'
            ? [{ timestamp: Math.floor(Date.now() / 1_000) }]
            : field === 'interestRateModelSets'
              ? [
                  {
                    floatingCurveA: '1',
                    floatingCurveB: '1',
                    floatingMaxUtilization: '1300000000000000000',
                    naturalUtilization: '750000000000000000',
                    sigmoidSpeed: '2500000000000000000',
                    growthSpeed: '1100000000000000000',
                    maxRate: '150000000000000000000',
                  },
                ]
              : field === 'accumulatorAccruals'
                ? [{ accumulatorAccrual: Math.floor(Date.now() / 1_000) }]
                : field === 'earningsAccumulatorSmoothFactorSets'
                  ? [{ smoothFactor: '1000000000000000000' }]
                  : field === 'treasurySets'
                    ? [{ treasuryFeeRate: '0' }]
                    : [
                        {
                          timestamp: Math.floor(Date.now() / 1_000),
                          maturity: Math.floor(Date.now() / 1_000),
                          unassignedEarnings: '0',
                        },
                      ],
      ]),
    );

    await route.fulfill({
      json: {
        data: {
          accounts: [],
          timelockControllerCalls: [],
          ...data,
        },
      },
    });
  });

  type Stream = {
    id: string;
    tokenId: string;
    recipient: Address;
    startTime: string;
    endTime: string;
    depositAmount: string;
    withdrawnAmount: string;
    canceled: boolean;
    cancelable: boolean;
    intactAmount: string;
    duration: string;
  };

  const streams = async (body: Stream[]) =>
    test.step(`setup: graph streams ${body.length}`, async () => {
      streamBody = body;
    });

  return {
    streams,
  };
}

export type Graph = ReturnType<typeof graph>;

export default graph;

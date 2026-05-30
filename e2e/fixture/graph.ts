import { test, type Page } from '@playwright/test';
import { type Address } from 'viem';

function graph(page: Page) {
  let streamBody: Stream[] = [];

  void page.route(/(sablier-labs\/sablier-v2-optimism|127\.0\.0\.1:31337\/subgraphs\/sablier)/, async (route) => {
    await route.fulfill({ json: { data: { streams: streamBody } } });
  });

  void page.route(/127\.0\.0\.1:31337\/subgraphs\/exactly/, async (route) => {
    await route.fulfill({ json: { data: { accounts: [], timelockControllerCalls: [] } } });
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

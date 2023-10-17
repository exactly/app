import { type Page } from '@playwright/test';
import { type Address } from 'viem';

function graph(page: Page) {
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

  const streams = async (body: Stream[]) => {
    await page.route(/sablier-labs\/sablier-v2-optimism$/, async (route) => {
      await route.fulfill({ json: { data: { streams: body } } });
    });
  };

  return {
    streams,
  };
}

export type Graph = ReturnType<typeof graph>;

export default graph;

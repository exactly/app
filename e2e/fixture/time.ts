import { type Page } from '@playwright/test';

function time(page: Page) {
  const now = async (timestamp: number) => {
    const fake = new Date(Math.floor(timestamp) * 1_000).valueOf();
    await page.addInitScript(`{
      Date = class extends Date {
        constructor(...args) {
          if (args.length === 0) {
            super(${fake});
          } else {
            super(...args);
          }
        }
      }
      const __DateNowOffset = ${fake} - Date.now();
      const __DateNow = Date.now;
      Date.now = () => __DateNow() + __DateNowOffset;
    }`);
  };

  return {
    now,
  };
}

export type Time = ReturnType<typeof time>;

export default time;

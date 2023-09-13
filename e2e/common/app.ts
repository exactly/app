import { CommonTest } from './types';

export default function ({ page }: CommonTest) {
  const reload = async () => {
    await new Promise((r) => setTimeout(r, 15_000));
    await page.reload({ waitUntil: 'domcontentloaded' });
    await new Promise((r) => setTimeout(r, 15_000));
    await page.waitForFunction(
      () => {
        return document.querySelectorAll('.MuiSkeleton-root').length === 0;
      },
      null,
      {
        timeout: 15_000,
        polling: 1_000,
      },
    );
  };

  return { reload };
}

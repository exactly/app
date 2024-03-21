import { CommonTest } from './types';

export default function ({ page }: CommonTest) {
  const reload = async () => {
    await page.reload({ waitUntil: 'domcontentloaded' });
    await page.waitForFunction(
      () => {
        return document.querySelectorAll('.MuiSkeleton-root').length === 0;
      },
      null,
      { polling: 1_000 },
    );
  };

  return { reload };
}

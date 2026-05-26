import type { CommonTest } from './types';

export default function ({ test, page }: CommonTest) {
  const reload = async () => {
    await test.step('navigation: reload', async () => {
      await page.reload({ waitUntil: 'domcontentloaded' });
    });
  };

  return { reload };
}

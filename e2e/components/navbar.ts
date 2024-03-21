import type { Page } from '@playwright/test';

type Path = 'markets' | 'dashboard';

export default function (page: Page) {
  const goTo = async (path: Path) => {
    await page.getByTestId(`navbar-link-${path}`).click();
    await page.waitForURL(`**/${path}`, { timeout: 15_000 });
    await page.waitForTimeout(1_000);
    await page.waitForFunction(
      () => {
        return document.querySelectorAll('.MuiSkeleton-root').length === 0;
      },
      null,
      { polling: 1_000 },
    );
  };

  return { goTo };
}

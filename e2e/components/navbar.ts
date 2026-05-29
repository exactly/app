import type { Page } from '@playwright/test';

type Path = 'markets' | 'dashboard';

export default function (page: Page) {
  const goTo = async (path: Path) => {
    await page.getByTestId(`navbar-link-${path}`).click();
    await page.waitForURL(`**/${path}`);
  };

  return { goTo };
}

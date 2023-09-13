import type { Page } from '@playwright/test';

import type { BaseTest } from '../fixture/base';

export type CommonTest = {
  test: BaseTest;
  page: Page;
};

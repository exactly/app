import type { ReactNode } from 'react';

export type Maturity = {
  label: ReactNode;
  value: string;
  apr?: number;
};

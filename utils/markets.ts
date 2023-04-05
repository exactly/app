import { BigNumber } from '@ethersproject/bignumber';

import { Previewer } from 'types/contracts/Previewer';

export function decodeMarkets(input: string): Previewer.MarketAccountStructOutput[] {
  return JSON.parse(input, (_, value) => {
    if (value?.type === 'BigNumber') return BigNumber.from(value.hex);
    if (Number.isFinite(Number(value?.tuple))) {
      const { tuple, ...fields } = value;
      return Object.assign(Array(tuple), fields);
    }
    return value;
  }) as Previewer.MarketAccountStructOutput[];
}

export function encodeMarkets(input: Previewer.MarketAccountStructOutput[]): string {
  return JSON.stringify(input, (_, value) =>
    Array.isArray(value) && Object.keys(value).some((key) => Number.isNaN(Number(key)))
      ? { tuple: value.length, ...value }
      : value,
  );
}

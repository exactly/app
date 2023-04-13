import dayjs from 'dayjs';
import { Provider } from '@ethersproject/abstract-provider';
import { AddressZero } from '@ethersproject/constants';

import { type ERC20TokenSymbol, previewer } from '../utils/contracts';
import type { Defer } from '../utils/types';

export const selectFixedPoolAsync = async (asset: ERC20TokenSymbol, provider: Defer<Provider>) => {
  const previewerContract = previewer(provider());
  const exactly = await previewerContract.exactly(AddressZero);
  const marketAccount = exactly.find((pool) => pool.assetSymbol === asset);

  if (!marketAccount) {
    throw new Error(`No ${asset} market found`);
  }

  const maturities = marketAccount.fixedPools.map((pool) => pool.maturity.toNumber()).sort();
  if (maturities.length < 2) {
    throw new Error('Not enough fixed pools');
  }
  const now = dayjs().unix();

  if (now + 21_600 > maturities[0]) {
    return maturities[1];
  }

  return maturities[0];
};

const maxPools = 3;
const interval = 2_419_200;

export const selectFixedPool = () => {
  const now = dayjs().unix();
  const timestamp = now - (now % interval);

  const maturities: number[] = [];

  for (let i = 0; i < maxPools; i++) {
    maturities.push(timestamp + (i + 1) * interval);
  }

  if (now + 21_600 > maturities[0]) {
    return maturities[1];
  }

  return maturities[0];
};

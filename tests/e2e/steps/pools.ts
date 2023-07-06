import dayjs from 'dayjs';

const maxPools = 3;
const interval = 2_419_200;

export const getFixedPools = (): number[] => {
  const now = dayjs().unix();
  const timestamp = now - (now % interval);

  const maturities: number[] = [];

  for (let i = 0; i < maxPools; i++) {
    maturities.push(timestamp + (i + 1) * interval);
  }

  return maturities;
};

export const selectFixedPool = () => {
  return selectPool(getFixedPools());
};

const selectPool = (pools: number[]): number => {
  if (pools.length < 2) {
    throw new Error('Not enough fixed pools');
  }

  return pools[1];
};

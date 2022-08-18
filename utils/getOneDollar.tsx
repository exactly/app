import { parseFixed } from '@ethersproject/bignumber';
import type { BigNumber } from 'ethers';
import numbers from 'config/numbers.json';

function getOneDollar(oracle: BigNumber, decimals: number) {
  const value = parseFixed(numbers.usdAmount.toString(), decimals + 18).div(oracle);

  return value;
}
export default getOneDollar;

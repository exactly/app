import type { BigNumber } from '@ethersproject/bignumber';
import { parseFixed } from '@ethersproject/bignumber';
import numbers from 'config/numbers.json';

function getOneDollar(oracle: BigNumber, decimals: number) {
  const value = parseFixed(numbers.usdAmount.toString(), decimals + 18).div(oracle);

  return value;
}
export default getOneDollar;

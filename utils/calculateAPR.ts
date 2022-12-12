import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

const ONE_YEAR_MS = 31536000;

export default (fee: BigNumber, decimals: number, assets: BigNumber, timestamp: string, maturity: number) => {
  const transactionRate = fee.mul(WeiPerEther).div(assets);
  const transactionTimestamp = parseFloat(timestamp);
  const transactionMaturity = maturity;
  const time = ONE_YEAR_MS / (transactionMaturity - transactionTimestamp);
  const transactionAPR = parseFloat(formatFixed(transactionRate, 18)) * time * 100;

  return { transactionAPR };
};

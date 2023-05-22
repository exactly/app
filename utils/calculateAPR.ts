import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import { WeiPerEther } from '@ethersproject/constants';

const ONE_YEAR_MS = 31536000;

export default (fee: BigNumber, assets: BigNumber, timestamp: string, maturity: number) => {
  const transactionRate = fee.mul(WeiPerEther).div(assets);
  const transactionTimestamp = parseFloat(timestamp);
  const transactionMaturity = maturity;
  const time = ONE_YEAR_MS / (transactionMaturity - transactionTimestamp);
  const transactionAPR = parseFloat(formatFixed(transactionRate, 18)) * time * 100;

  return { transactionAPR };
};

export function calculateAPR(fee: BigNumber, assets: BigNumber, timestamp: string, maturity: number): BigNumber {
  const transactionRate = fee.mul(WeiPerEther).div(assets);
  const transactionTimestamp = BigNumber.from(Number(timestamp));
  const transactionMaturity = BigNumber.from(maturity);
  const time = BigNumber.from(ONE_YEAR_MS).mul(WeiPerEther).div(transactionMaturity.sub(transactionTimestamp));
  return transactionRate.mul(time).div(WeiPerEther);
}

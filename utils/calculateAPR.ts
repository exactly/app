import { BigNumber, formatFixed } from '@ethersproject/bignumber';

const ONE_YEAR_MS = 31536000;

export default (fee: BigNumber, decimals: number, assets: BigNumber, timestamp: string, maturity: string) => {
  const transactionFee = parseFloat(formatFixed(fee, decimals));
  const transactionAmount = parseFloat(formatFixed(assets, decimals));
  const transactionRate = transactionFee / transactionAmount;
  const transactionTimestamp = parseFloat(timestamp);
  const transactionMaturity = parseFloat(maturity);
  const time = ONE_YEAR_MS / (transactionMaturity - transactionTimestamp);
  const transactionAPR = transactionRate * time * 100;

  return { transactionAPR, transactionAmount };
};

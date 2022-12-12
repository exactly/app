import { formatFixed } from '@ethersproject/bignumber';
import request from 'graphql-request';

import { getLastMaturityPoolBorrowRate, getLastMaturityPoolDepositRate } from 'queries';

import { AccountData } from 'types/AccountData';
import { Maturity } from 'types/Maturity';

import networkData from 'config/networkData.json' assert { type: 'json' };

async function getLastAPR(maturity: Maturity[], symbol: string, chainId: number, accountData: AccountData) {
  const subgraphUrl = networkData[String(chainId) as keyof typeof networkData]?.subgraph;
  if (!subgraphUrl) return;
  const { decimals, market } = accountData[symbol];

  const dataPromise = maturity.map(async (maturity) => {
    const getLastBorrowRate = await request(subgraphUrl, getLastMaturityPoolBorrowRate(market, maturity.value));

    const getLastDepositRate = await request(subgraphUrl, getLastMaturityPoolDepositRate(market, maturity.value));

    const data = {
      getLastBorrowRate,
      getLastDepositRate,
      maturity: maturity.value,
      date: maturity.label,
    };

    return data;
  });

  return Promise.all(dataPromise).then((data) => {
    const deposit: any = [];
    const borrow: any = [];

    data.forEach((maturityData) => {
      const depositData: any = {
        value: maturityData?.maturity,
        date: maturityData?.date,
        type: 'deposit',
      };
      const borrowData: any = {
        value: maturityData?.maturity,
        date: maturityData?.date,
        type: 'borrow',
      };

      //BORROW
      const borrowFee = maturityData?.getLastBorrowRate?.borrowAtMaturities[0]?.fee;
      const borrowAmount = maturityData?.getLastBorrowRate?.borrowAtMaturities[0]?.assets;
      const borrowTime =
        31536000 /
        (parseInt(maturityData.maturity!) - maturityData?.getLastBorrowRate?.borrowAtMaturities[0]?.timestamp);

      //DEPOSIT
      const depositFee = maturityData?.getLastDepositRate?.depositAtMaturities[0]?.fee;
      const depositAmount = maturityData?.getLastDepositRate?.depositAtMaturities[0]?.assets;
      const depositTime =
        31536000 /
        (parseInt(maturityData.maturity!) - maturityData?.getLastDepositRate?.depositAtMaturities[0]?.timestamp);

      let fixedBorrowAPR = 0;
      let fixedDepositAPR = 0;

      if (borrowFee && decimals && borrowAmount) {
        const borrowFixedRate =
          parseFloat(formatFixed(borrowFee, decimals)) / parseFloat(formatFixed(borrowAmount, decimals));
        fixedBorrowAPR = (borrowFixedRate - 1) * borrowTime * 100;
      }

      if (depositFee && decimals && depositAmount) {
        const depositFixedRate =
          parseFloat(formatFixed(depositFee, decimals)) / parseFloat(formatFixed(depositAmount, decimals));
        fixedDepositAPR = (depositFixedRate - 1) * depositTime * 100;
      }

      depositData.apr = Number(fixedDepositAPR.toFixed(2));
      borrowData.apr = Number(fixedBorrowAPR.toFixed(2));

      deposit.push(depositData);
      borrow.push(borrowData);
    });

    const sortedDeposit = deposit.sort((a: any, b: any) => {
      return parseInt(a.value) - parseInt(b.value);
    });
    const sortedBorrow = borrow.sort((a: any, b: any) => {
      return parseInt(a.value) - parseInt(b.value);
    });

    return { sortedDeposit, sortedBorrow };
  });
}

export default getLastAPR;

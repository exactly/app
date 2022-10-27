import { formatFixed, parseFixed, BigNumber } from '@ethersproject/bignumber';
import { PreviewFixedAtAllMaturities } from 'types/FixedMarketData';
import { MaxUint256 } from '@ethersproject/constants';

import numbers from 'config/numbers.json';
import { toPercentage } from 'utils/utils';

export type APRsPerMaturityType = Record<string, { borrow: number | string; deposit: number | string }>;

type CuratedMaturityAPRs = {
  APRsPerMaturity: APRsPerMaturityType;
  maturityMaxAPRDeposit: number;
  maturityMinAPRBorrow: number;
};

const { minAPRValue } = numbers;

const getAPRsPerMaturity = (
  deposits: PreviewFixedAtAllMaturities[],
  borrows: PreviewFixedAtAllMaturities[],
  decimals: number,
  initialAssets: BigNumber,
): CuratedMaturityAPRs => {
  const APRsPerMaturity: APRsPerMaturityType = {};

  const timestampNow = Date.now() / 1000;
  let maturityMaxAPRDeposit = 0;
  deposits.forEach(({ maturity: maturityBN, assets: finalDepositAssets }) => {
    const maturity = maturityBN.toNumber();
    const timePerYear = 31_536_000 / (maturity - timestampNow);
    const rate = finalDepositAssets.mul(parseFixed('1', 18)).div(initialAssets);
    const depositAPR = (Number(formatFixed(rate, 18)) - 1) * timePerYear * 100;

    const actualMax = APRsPerMaturity[maturityMaxAPRDeposit]?.deposit;
    if (depositAPR > minAPRValue && (!actualMax || depositAPR > APRsPerMaturity[maturityMaxAPRDeposit]?.deposit)) {
      maturityMaxAPRDeposit = maturity;
    }

    APRsPerMaturity[maturity] = {
      ...APRsPerMaturity[maturity],
      deposit: depositAPR < minAPRValue ? 'N/A' : depositAPR.toFixed(2),
    };
  });

  let maturityMinAPRBorrow = 0;
  borrows.forEach(({ maturity: maturityBN, assets: finalBorrowAssets }) => {
    const maturity = maturityBN.toNumber();
    const timePerYear = 31_536_000 / (maturity - timestampNow);
    const rate = finalBorrowAssets.eq(MaxUint256)
      ? undefined
      : finalBorrowAssets.mul(parseFixed('1', 18)).div(initialAssets);
    const borrowAPR = rate && (Number(formatFixed(rate, 18)) - 1) * timePerYear;
    if (borrowAPR) {
      const actualMin = APRsPerMaturity[maturityMinAPRBorrow]?.borrow;

      if (borrowAPR > minAPRValue && (!actualMin || borrowAPR < actualMin)) {
        maturityMinAPRBorrow = maturity;
      }
    }

    APRsPerMaturity[maturity] = {
      ...APRsPerMaturity[maturity],
      borrow: borrowAPR && borrowAPR < minAPRValue ? 'N/A' : toPercentage(borrowAPR),
    };
  });

  return {
    APRsPerMaturity,
    maturityMaxAPRDeposit,
    maturityMinAPRBorrow,
  };
};

export default getAPRsPerMaturity;

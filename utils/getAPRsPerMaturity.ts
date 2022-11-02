import { formatFixed, BigNumber } from '@ethersproject/bignumber';
import { PreviewFixedAtAllMaturities } from 'types/FixedMarketData';
import { MaxUint256, WeiPerEther } from '@ethersproject/constants';

import numbers from 'config/numbers.json';

export type APRsPerMaturityType = Record<string, { borrow: number; deposit: number }>;

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

  let maturityMaxAPRDeposit = 0;
  deposits.forEach(({ maturity: maturityBN, assets: finalDepositAssets }) => {
    const maturity = maturityBN.toNumber();
    const actualMax = APRsPerMaturity[maturityMaxAPRDeposit]?.deposit;
    const fees = finalDepositAssets.sub(initialAssets);

    const assetsRate = fees
      .mul(WeiPerEther.mul(31_536_000))
      .div(initialAssets.mul(maturity - Math.floor(Date.now() / 1_000)));

    const depositAPR = Number(formatFixed(assetsRate, 18));

    if (depositAPR > minAPRValue && (!actualMax || depositAPR > APRsPerMaturity[maturityMaxAPRDeposit]?.deposit)) {
      maturityMaxAPRDeposit = maturity;
    }

    APRsPerMaturity[maturity] = {
      ...APRsPerMaturity[maturity],
      deposit: depositAPR,
    };
  });

  let maturityMinAPRBorrow = 0;

  borrows.forEach(({ maturity: maturityBN, assets: finalBorrowAssets }) => {
    const maturity = maturityBN.toNumber();
    const fees = finalBorrowAssets.sub(initialAssets);

    const assetsRate = finalBorrowAssets.eq(MaxUint256)
      ? 0
      : fees.mul(WeiPerEther.mul(31_536_000)).div(initialAssets.mul(maturity - Math.floor(Date.now() / 1_000)));

    const borrowAPR = Number(formatFixed(assetsRate, 18));

    if (borrowAPR) {
      const actualMin = APRsPerMaturity[maturityMinAPRBorrow]?.borrow;

      if (borrowAPR > minAPRValue && (!actualMin || borrowAPR < actualMin)) {
        maturityMinAPRBorrow = maturity;
      }
    }

    APRsPerMaturity[maturity] = {
      ...APRsPerMaturity[maturity],
      borrow: borrowAPR,
    };
  });

  return {
    APRsPerMaturity,
    maturityMaxAPRDeposit,
    maturityMinAPRBorrow,
  };
};

export default getAPRsPerMaturity;

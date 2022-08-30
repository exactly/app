import { BigNumber, ethers } from 'ethers';
import { parseFixed } from '@ethersproject/bignumber';

import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';
import { WAD } from './fixedPointMathLib';

function getHealthFactorData(accountData: AccountData) {
  let collateral = ethers.constants.Zero;
  let debt = ethers.constants.Zero;

  const data = Object.values(accountData);

  try {
    data.forEach((fixedLender: FixedLenderAccountData) => {
      let fixedLenderCollateral = ethers.constants.Zero;
      let fixedLenderDebt = ethers.constants.Zero;
      const decimals = fixedLender.decimals;
      const decimalWAD = parseFixed('1', decimals); //WAD based on the decimals of the fixedLender

      const oracle = fixedLender.oraclePrice;
      const adjustFactor = fixedLender.adjustFactor;

      //Collateral
      if (fixedLender.isCollateral) {
        const assets = fixedLender.floatingDepositAssets;

        fixedLenderCollateral = fixedLenderCollateral.add(assets.mul(oracle).div(decimalWAD));
      }

      collateral = collateral.add(fixedLenderCollateral.mul(adjustFactor).div(WAD));

      //Floating Debt
      if (fixedLender.floatingBorrowAssets) {
        const borrowAssets = fixedLender.floatingBorrowAssets;

        fixedLenderDebt = fixedLenderDebt.add(borrowAssets.mul(oracle)).div(decimalWAD);
      }

      //Fixed Debt
      fixedLender.fixedBorrowPositions.forEach((borrowPosition) => {
        const penaltyRate = fixedLender.penaltyRate;
        const principal = borrowPosition.position.principal;
        const fee = borrowPosition.position.fee;

        const maturityTimestamp = borrowPosition.maturity;
        const currentTimestamp = BigNumber.from(Math.floor(Date.now() / 1000));

        const position = principal.add(fee);

        fixedLenderDebt = fixedLenderDebt.add(position.mul(oracle).div(decimalWAD));

        if (maturityTimestamp.gt(currentTimestamp)) {
          const time = currentTimestamp.sub(maturityTimestamp);

          fixedLenderDebt = fixedLenderDebt.add(time.mul(penaltyRate));
        }
      });

      debt = debt.add(fixedLenderDebt.mul(WAD).div(adjustFactor));
    });

    return { collateral, debt };
  } catch (e) {
    console.log(e);
    return { collateral, debt };
  }
}

export default getHealthFactorData;

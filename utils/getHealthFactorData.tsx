import { ethers } from 'ethers';

import { AccountData } from 'types/AccountData';
import { FixedLenderAccountData } from 'types/FixedLenderAccountData';

function getHealthFactorData(accountData: AccountData) {
  let collateral = 0;
  let debt = 0;

  const data = Object.values(accountData);

  try {
    data.forEach((fixedLender: FixedLenderAccountData) => {
      let fixedLenderCollateral = 0;
      let fixedLenderDebt = 0;
      const decimals = fixedLender.decimals;

      const oracle = parseFloat(ethers.utils.formatUnits(fixedLender.oraclePrice, 18));
      const collateralFactor = parseFloat(ethers.utils.formatUnits(fixedLender.adjustFactor, 18));

      //Collateral
      if (fixedLender.isCollateral) {
        const assets = parseFloat(
          ethers.utils.formatUnits(fixedLender.floatingDepositAssets, decimals)
        );

        fixedLenderCollateral += assets * oracle;
      }

      collateral += fixedLenderCollateral * collateralFactor;

      //Floating Debt
      if (fixedLender.floatingBorrowAssets) {
        const borrowAssets = parseFloat(
          ethers.utils.formatUnits(fixedLender.floatingBorrowAssets, decimals)
        );

        fixedLenderDebt += borrowAssets * oracle;
      }

      //Fixed Debt
      fixedLender.fixedBorrowPositions.forEach((borrowPosition) => {
        const penaltyRate = parseFloat(ethers.utils.formatUnits(fixedLender.penaltyRate, 18));
        const principal = parseFloat(
          ethers.utils.formatUnits(borrowPosition.position.principal, decimals)
        );
        const fee = parseFloat(ethers.utils.formatUnits(borrowPosition.position.fee, decimals));
        const maturityTimestamp = borrowPosition.maturity.toNumber();
        const currentTimestamp = new Date().getTime() / 1000;

        fixedLenderDebt += (principal + fee) * oracle;

        if (maturityTimestamp > currentTimestamp) {
          fixedLenderDebt += (currentTimestamp - maturityTimestamp) * penaltyRate;
        }
      });

      debt += fixedLenderDebt / collateralFactor;
    });

    return { collateral, debt };
  } catch (e) {
    console.log(e);
    return { collateral, debt };
  }
}

export default getHealthFactorData;

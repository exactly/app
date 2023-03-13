import { BigNumber, parseFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';

import { Previewer } from 'types/contracts';
import { HealthFactor } from 'types/HealthFactor';
import { WAD } from './queryRates';

function getHealthFactorData(accountData: Previewer.MarketAccountStructOutput[]): HealthFactor {
  let collateral = Zero;
  let debt = Zero;

  try {
    accountData.forEach((fixedLender) => {
      let fixedLenderCollateral = Zero;
      let fixedLenderDebt = Zero;
      const decimals = fixedLender.decimals;
      const decimalWAD = parseFixed('1', decimals); //WAD based on the decimals of the fixedLender

      const oracle = fixedLender.usdPrice;
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

        if (currentTimestamp.gt(maturityTimestamp)) {
          const time = currentTimestamp.sub(maturityTimestamp);

          fixedLenderDebt = fixedLenderDebt.add(time.mul(penaltyRate));
        }
      });

      debt = debt.add(fixedLenderDebt.mul(WAD).div(adjustFactor));
    });

    return { collateral, debt };
  } catch {
    return { collateral, debt };
  }
}

export default getHealthFactorData;

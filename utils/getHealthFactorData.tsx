import { MarketAccount } from 'hooks/useAccountData';
import { parseUnits } from 'viem';
import dayjs from 'dayjs';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import { HealthFactor } from 'types/HealthFactor';

function getHealthFactorData(accountData: readonly MarketAccount[]): HealthFactor {
  let collateral = 0n;
  let debt = 0n;

  try {
    accountData.forEach((fixedLender) => {
      let fixedLenderCollateral = 0n;
      let fixedLenderDebt = 0n;
      const decimals = fixedLender.decimals;
      const decimalWAD = parseUnits('1', decimals);

      const oracle = fixedLender.usdPrice;
      const adjustFactor = fixedLender.adjustFactor;

      //Collateral
      if (fixedLender.isCollateral) {
        const assets = fixedLender.floatingDepositAssets;

        fixedLenderCollateral = fixedLenderCollateral + (assets * oracle) / decimalWAD;
      }

      collateral = collateral + (fixedLenderCollateral * adjustFactor) / WAD;

      //Floating Debt
      if (fixedLender.floatingBorrowAssets) {
        const borrowAssets = fixedLender.floatingBorrowAssets;

        fixedLenderDebt = (fixedLenderDebt + borrowAssets * oracle) / decimalWAD;
      }

      //Fixed Debt
      fixedLender.fixedBorrowPositions.forEach((borrowPosition) => {
        const penaltyRate = fixedLender.penaltyRate;
        const { principal, fee } = borrowPosition.position;
        const maturityTimestamp = borrowPosition.maturity;

        const currentTimestamp = BigInt(Math.floor(dayjs().unix()));

        const position = principal + fee;

        fixedLenderDebt =
          fixedLenderDebt +
          ((currentTimestamp > maturityTimestamp
            ? position + (position * ((currentTimestamp - maturityTimestamp) * penaltyRate)) / WAD
            : position) *
            oracle) /
            decimalWAD;
      });

      debt = debt + (fixedLenderDebt * WAD) / adjustFactor;
    });

    return { collateral, debt };
  } catch {
    return { collateral, debt };
  }
}

export default getHealthFactorData;

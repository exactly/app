import React, { useCallback, useContext, useMemo, useState } from 'react';
import { CircularProgress, Tooltip, Typography } from '@mui/material';
import { WeiPerEther } from '@ethersproject/constants';

import StyledSwitch from 'components/Switch';
import AccountDataContext from 'contexts/AccountDataContext';
import parseHealthFactor from 'utils/parseHealthFactor';
import { HealthFactor } from 'types/HealthFactor';
import useAuditor from 'hooks/useAuditor';
import getHealthFactorData from 'utils/getHealthFactorData';
import handleOperationError from 'utils/handleOperationError';

type Props = {
  symbol: string;
};

function SwitchCollateral({ symbol }: Props) {
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const auditor = useAuditor();

  const healthFactor = useMemo<HealthFactor | undefined>(() => {
    if (!accountData) return undefined;
    return getHealthFactorData(accountData);
  }, [accountData]);

  const [optimistic, setOptimistic] = useState<boolean | undefined>();

  const checked = useMemo<boolean>(() => {
    if (!accountData) return false;
    if (optimistic !== undefined) return optimistic;
    return accountData[symbol].isCollateral;
  }, [accountData, symbol, optimistic]);

  const { disabled, disabledText } = useMemo<{ disabled: boolean; disabledText?: string }>(() => {
    if (!accountData || !healthFactor) return { disabled: true };

    const { floatingBorrowAssets, fixedBorrowPositions, isCollateral, usdPrice, floatingDepositAssets } =
      accountData[symbol];

    if (!floatingBorrowAssets.isZero() || fixedBorrowPositions.length > 0) {
      return {
        disabled: true,
        disabledText: "You can't disable collateral on this asset because you have an active borrow",
      };
    }

    const collateralUsd = floatingDepositAssets.mul(usdPrice).div(WeiPerEther);
    const newHF = parseFloat(parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(collateralUsd)));

    if (isCollateral && newHF < 1) {
      return { disabled: true, disabledText: 'Disabling this collateral will make your health factor less than 1' };
    }

    return { disabled: false };
  }, [accountData, healthFactor, symbol]);

  const [loading, setLoading] = useState<boolean>(false);

  const onToggle = useCallback(async () => {
    if (!accountData || !auditor) return;
    const { market } = accountData[symbol];
    let target = !checked;

    setLoading(true);
    try {
      const tx = await (checked ? auditor.exitMarket(market) : auditor.enterMarket(market));
      await tx.wait();

      await getAccountData();
    } catch (error) {
      target = checked;
      handleOperationError(error);
    } finally {
      setOptimistic(target);
      setLoading(false);
    }
  }, [accountData, auditor, getAccountData, symbol, checked]);

  if (loading)
    return (
      <CircularProgress color="primary" size={24} thickness={8} data-testid={`switch-collateral-${symbol}-loading`} />
    );

  return (
    <Tooltip
      title={
        <Typography fontSize="1.2em" fontWeight={600} data-testid={`switch-collateral-${symbol}-tooltip`}>
          {!checked
            ? 'Enable this asset as collateral'
            : disabledText && disabled
            ? disabledText
            : 'Disabling this asset as collateral affects your borrowing power and Health Factor'}
        </Typography>
      }
      placement="top"
      arrow
    >
      <span data-testid={`switch-collateral-${symbol}-wrapper`}>
        <StyledSwitch
          checked={checked}
          onChange={onToggle}
          inputProps={{
            'aria-label': 'Use this asset as collateral',
            'data-testid': `switch-collateral-${symbol}`,
          }}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  );
}

export default SwitchCollateral;

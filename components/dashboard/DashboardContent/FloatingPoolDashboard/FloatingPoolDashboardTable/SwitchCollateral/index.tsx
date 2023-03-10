import React, { useCallback, useMemo, useState } from 'react';
import { CircularProgress, Tooltip, Typography } from '@mui/material';
import { WeiPerEther } from '@ethersproject/constants';

import StyledSwitch from 'components/Switch';
import parseHealthFactor from 'utils/parseHealthFactor';
import useAuditor from 'hooks/useAuditor';
import handleOperationError from 'utils/handleOperationError';
import { useNetwork } from 'wagmi';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';
import { useWeb3 } from 'hooks/useWeb3';

type Props = {
  symbol: string;
};

function SwitchCollateral({ symbol }: Props) {
  const { marketAccount, refreshAccountData } = useAccountData(symbol);
  const auditor = useAuditor();
  const { chain } = useNetwork();
  const { chain: displayNetwork } = useWeb3();

  const healthFactor = useHealthFactor();

  const checked = useMemo<boolean>(() => Boolean(marketAccount?.isCollateral), [marketAccount]);

  const { disabled, disabledText } = useMemo<{ disabled: boolean; disabledText?: string }>(() => {
    if (!marketAccount || !healthFactor) return { disabled: true };

    if (chain && displayNetwork.id !== chain.id) {
      return { disabled: true, disabledText: 'You are connected to a different network' };
    }

    const { floatingBorrowAssets, fixedBorrowPositions, isCollateral, usdPrice, floatingDepositAssets, adjustFactor } =
      marketAccount;

    if (!floatingBorrowAssets.isZero() || fixedBorrowPositions.length > 0) {
      return {
        disabled: true,
        disabledText: "You can't disable collateral on this asset because you have an active borrow",
      };
    }

    const collateralUsd = floatingDepositAssets.mul(usdPrice).div(WeiPerEther);
    const newHF = parseFloat(
      parseHealthFactor(
        healthFactor.debt,
        healthFactor.collateral.sub(collateralUsd.mul(adjustFactor).div(WeiPerEther)),
      ),
    );

    if (isCollateral && newHF < 1) {
      return { disabled: true, disabledText: 'Disabling this collateral will make your health factor less than 1' };
    }

    return { disabled: false };
  }, [marketAccount, healthFactor, chain, displayNetwork.id]);

  const [loading, setLoading] = useState<boolean>(false);

  const onToggle = useCallback(async () => {
    if (!marketAccount || !auditor) return;
    const { market } = marketAccount;

    setLoading(true);
    try {
      const tx = await (checked ? auditor.exitMarket(market) : auditor.enterMarket(market));
      await tx.wait();

      await refreshAccountData();
    } catch (error) {
      handleOperationError(error);
    } finally {
      setLoading(false);
    }
  }, [marketAccount, auditor, checked, refreshAccountData]);

  if (loading) return <CircularProgress color="primary" size={24} thickness={8} sx={{ ml: '7px' }} />;

  const tooltip =
    disabled && disabledText
      ? disabledText
      : checked
      ? 'Disabling this asset as collateral affects your borrowing power and Health Factor'
      : 'Enable this asset as collateral';

  return (
    <Tooltip
      title={
        <Typography fontSize="1.2em" fontWeight={600}>
          {tooltip}
        </Typography>
      }
      placement="top"
      arrow
    >
      <span>
        <StyledSwitch
          checked={checked}
          onChange={onToggle}
          inputProps={{ 'aria-label': 'Use this asset as collateral' }}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  );
}

export default SwitchCollateral;

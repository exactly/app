import React, { useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { CircularProgress, Skeleton, Tooltip, Typography } from '@mui/material';
import { captureException } from '@sentry/nextjs';
import { WeiPerEther } from '@ethersproject/constants';
import { ErrorCode } from '@ethersproject/logger';

import StyledSwitch from 'components/Switch';
import AccountDataContext from 'contexts/AccountDataContext';
import parseHealthFactor from 'utils/parseHealthFactor';
import { HealthFactor } from 'types/HealthFactor';
import useAuditor from 'hooks/useAuditor';
import getHealthFactorData from 'utils/getHealthFactorData';
import { useWeb3 } from 'hooks/useWeb3';

type Props = {
  symbol?: string;
};

function SwitchCollateral({ symbol }: Props) {
  const { walletAddress } = useWeb3();
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const auditor = useAuditor();

  const healthFactor = useMemo<HealthFactor | undefined>(() => {
    if (!accountData) return undefined;
    return getHealthFactorData(accountData);
  }, [accountData]);

  const [toggle, setToggle] = useState<boolean>(false);
  const [disabled, setDisabled] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(false);
  const [disabledText, setDisabledText] = useState<string | undefined>();

  const checkCollaterals = useCallback(() => {
    if (!accountData || !symbol) return;
    setToggle(false);
    setDisabled(false);

    const { [symbol]: currentMarket } = accountData;
    const floatingPositions = currentMarket.floatingBorrowAssets;
    const fixedPositions = currentMarket.fixedBorrowPositions;

    if (!floatingPositions.isZero() || fixedPositions.length > 0) {
      setDisabledText(`You can't disable collateral on this asset because you have an active borrow`);
      setDisabled(true);
    }

    if (currentMarket.isCollateral) {
      setToggle(true);
      if (!healthFactor) return;

      const usdPrice = currentMarket.usdPrice;
      const collateralAssets = currentMarket.floatingDepositAssets;
      const collateralUsd = collateralAssets.mul(usdPrice).div(WeiPerEther);

      const newHF = parseFloat(parseHealthFactor(healthFactor.debt, healthFactor.collateral.sub(collateralUsd)));

      if (newHF < 1) {
        setDisabledText('Disabling this collateral will make your health factor less than 1');
      }
    }
  }, [accountData, healthFactor, symbol]);

  useEffect(() => {
    checkCollaterals();
  }, [accountData, walletAddress, healthFactor, checkCollaterals]);

  const onToggle = useCallback(async () => {
    setToggle((prev) => !prev);
    if (!accountData || !symbol || !auditor) return;
    const { market } = accountData[symbol];

    try {
      setLoading(true);
      const tx = await (toggle ? auditor.exitMarket(market) : auditor.enterMarket(market));
      await tx.wait();
      setToggle(!toggle);
      setLoading(false);

      await getAccountData();
    } catch (error: any) {
      if (error.code !== ErrorCode.ACTION_REJECTED) captureException(error);
      setToggle((prev) => !prev);
      setLoading(false);
    }
  }, [accountData, auditor, getAccountData, symbol, toggle]);

  if (!symbol) return <Skeleton animation="wave" width={40} height={36} sx={{ borderRadius: '12px' }} />;
  if (loading) return <CircularProgress color="primary" size={24} thickness={8} />;

  return (
    <Tooltip
      title={
        <Typography fontSize="1.2em" fontWeight={600}>
          {!toggle
            ? 'Enable this asset as collateral'
            : disabledText && disabled
            ? disabledText
            : 'Disabling this asset as collateral affects your borrowing power and Health Factor'}
        </Typography>
      }
      placement="top"
      arrow
    >
      <span>
        <StyledSwitch
          checked={toggle}
          onChange={onToggle}
          inputProps={{ 'aria-label': 'controlled' }}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  );
}

export default SwitchCollateral;

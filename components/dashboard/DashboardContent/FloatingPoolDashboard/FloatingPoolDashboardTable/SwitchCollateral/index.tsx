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
import { useNetwork, useSwitchNetwork } from 'wagmi';
import { useNetworkContext } from 'contexts/NetworkContext';

type Props = {
  symbol: string;
};

function SwitchCollateral({ symbol }: Props) {
  const { accountData, getAccountData } = useContext(AccountDataContext);
  const auditor = useAuditor();
  const { chain } = useNetwork();
  const { switchNetworkAsync } = useSwitchNetwork();
  const { displayNetwork } = useNetworkContext();

  const healthFactor = useMemo<HealthFactor | undefined>(() => {
    if (!accountData) return undefined;
    return getHealthFactorData(accountData);
  }, [accountData]);

  const checked = useMemo<boolean>(() => {
    if (!accountData) return false;
    return accountData[symbol].isCollateral;
  }, [accountData, symbol]);

  const { disabled, disabledText } = useMemo<{ disabled: boolean; disabledText?: string }>(() => {
    if (!accountData || !healthFactor) return { disabled: true };

    const { floatingBorrowAssets, fixedBorrowPositions, isCollateral, usdPrice, floatingDepositAssets, adjustFactor } =
      accountData[symbol];

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
  }, [accountData, healthFactor, symbol]);

  const [loading, setLoading] = useState<boolean>(false);

  const onToggle = useCallback(async () => {
    if (!accountData || !auditor) return;
    const { market } = accountData[symbol];

    setLoading(true);
    try {
      if (chain && displayNetwork.id !== chain.id) {
        return await switchNetworkAsync?.(displayNetwork.id);
      }

      const tx = await (checked ? auditor.exitMarket(market) : auditor.enterMarket(market));
      await tx.wait();

      await getAccountData();
    } catch (error) {
      handleOperationError(error);
    } finally {
      setLoading(false);
    }
  }, [accountData, auditor, symbol, chain, displayNetwork.id, checked, getAccountData, switchNetworkAsync]);

  if (loading) return <CircularProgress color="primary" size={24} thickness={8} sx={{ ml: '7px' }} />;

  return (
    <Tooltip
      title={
        <Typography fontSize="1.2em" fontWeight={600}>
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

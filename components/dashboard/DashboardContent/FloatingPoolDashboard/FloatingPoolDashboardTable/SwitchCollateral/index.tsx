import React, { useCallback, useMemo, useState } from 'react';
import { CircularProgress, Tooltip, Typography } from '@mui/material';
import { useNetwork, useSwitchNetwork } from 'wagmi';
import WAD from '@exactly/lib/esm/fixed-point-math/WAD';

import waitForTransaction from 'utils/waitForTransaction';

import StyledSwitch from 'components/Switch';
import parseHealthFactor from 'utils/parseHealthFactor';
import useAuditor from 'hooks/useAuditor';
import handleOperationError from 'utils/handleOperationError';
import useHealthFactor from 'hooks/useHealthFactor';
import useAccountData from 'hooks/useAccountData';
import { useWeb3 } from 'hooks/useWeb3';
import { useTranslation } from 'react-i18next';
import { track } from 'utils/mixpanel';

type Props = {
  symbol: string;
};

function SwitchCollateral({ symbol }: Props) {
  const { t } = useTranslation();
  const { marketAccount, refreshAccountData } = useAccountData(symbol);
  const auditor = useAuditor();
  const { chain } = useNetwork();
  const { chain: displayNetwork, opts } = useWeb3();

  const healthFactor = useHealthFactor();
  const { switchNetworkAsync } = useSwitchNetwork();

  const [optimistic, setOptimistic] = useState<boolean | undefined>();
  const checked = useMemo<boolean>(() => {
    if (!marketAccount) return false;
    if (optimistic !== undefined) return optimistic;
    return Boolean(marketAccount?.isCollateral);
  }, [marketAccount, optimistic]);

  const { disabled, disabledText } = useMemo<{ disabled: boolean; disabledText?: string }>(() => {
    if (!marketAccount || !healthFactor) return { disabled: true };

    const { floatingBorrowAssets, fixedBorrowPositions, isCollateral, usdPrice, floatingDepositAssets, adjustFactor } =
      marketAccount;

    if (floatingBorrowAssets !== 0n || fixedBorrowPositions.length > 0) {
      return {
        disabled: true,
        disabledText: t("You can't disable collateral on this asset because you have an active borrow"),
      };
    }

    const collateralUsd = (floatingDepositAssets * usdPrice) / 10n ** BigInt(marketAccount.decimals);
    const newHF = parseFloat(
      parseHealthFactor(healthFactor.debt, healthFactor.collateral - (collateralUsd * adjustFactor) / WAD),
    );

    if (isCollateral && newHF < 1) {
      return { disabled: true, disabledText: t('Disabling this collateral will make your health factor less than 1') };
    }

    return { disabled: false };
  }, [marketAccount, healthFactor, t]);

  const [loading, setLoading] = useState<boolean>(false);

  const onToggle = useCallback(async () => {
    if (!marketAccount || !auditor || !opts) return;
    const { market } = marketAccount;
    let target = !checked;
    track('Option Selected', {
      name: 'switch collateral',
      location: 'Dashboard',
      value: target,
      prevValue: checked,
      symbol,
    });

    setLoading(true);
    try {
      const hash = await (checked
        ? auditor.write.exitMarket([market], opts)
        : auditor.write.enterMarket([market], opts));
      await waitForTransaction({ hash });

      await refreshAccountData();
    } catch (error) {
      target = checked;
      handleOperationError(error);
    } finally {
      setOptimistic(target);
      setLoading(false);
    }
  }, [marketAccount, auditor, opts, checked, symbol, refreshAccountData]);

  const switchNetworkAndToggle = useCallback(async () => {
    if (!(chain && chain.id !== displayNetwork.id && switchNetworkAsync)) {
      return onToggle();
    }
    try {
      const result = await switchNetworkAsync(displayNetwork.id);

      if (result.id === displayNetwork.id) {
        onToggle();
      }
    } catch (error) {
      return;
    }
  }, [chain, displayNetwork.id, onToggle, switchNetworkAsync]);

  if (loading) {
    return (
      <CircularProgress
        color="primary"
        size={24}
        thickness={8}
        sx={{ ml: '7px' }}
        data-testid={`switch-collateral-${symbol}-loading`}
      />
    );
  }

  const tooltip =
    disabled && disabledText
      ? disabledText
      : checked
        ? t('Disabling this asset as collateral affects your borrowing power and Health Factor')
        : t('Enable this asset as collateral');

  return (
    <Tooltip
      title={
        <Typography fontSize="1.2em" fontWeight={600} data-testid={`switch-collateral-${symbol}-tooltip`}>
          {tooltip}
        </Typography>
      }
      placement="top"
      arrow
    >
      <span data-testid={`switch-collateral-${symbol}-wrapper`}>
        <StyledSwitch
          checked={checked}
          onChange={switchNetworkAndToggle}
          inputProps={{
            'aria-label': t('Use this asset as collateral'),
            'data-testid': `switch-collateral-${symbol}`,
          }}
          disabled={disabled}
        />
      </span>
    </Tooltip>
  );
}

export default SwitchCollateral;

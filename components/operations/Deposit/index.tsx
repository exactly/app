import React, { ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import type { Hex } from 'viem';

import ModalGif from 'components/OperationsModal/ModalGif';

import useBalance from 'hooks/useBalance';
import useAccountData from 'hooks/useAccountData';
import { useOperationContext } from 'contexts/OperationContext';
import { ModalBox, ModalBoxRow, ModalBoxCell } from 'components/common/modal/ModalBox';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import { Grid } from '@mui/material';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import useDeposit from 'hooks/useDeposit';
import ModalRewards from 'components/OperationsModal/ModalRewards';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import { toPercentage } from 'utils/utils';
import ModalInfoAPR from 'components/OperationsModal/Info/ModalInfoAPR';
import useTranslateOperation from 'hooks/useTranslateOperation';

const Deposit = ({ children, onSuccess }: { children?: ReactNode; onSuccess?: (hash?: Hex) => void }) => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { symbol, errorData, qty } = useOperationContext();
  const { isLoading, isPreparing, onMax, handleInputChange, handleSubmitAction, deposit, txStatus, txHash } =
    useDeposit();
  const { marketAccount } = useAccountData(symbol);
  const walletBalance = useBalance(symbol, marketAccount?.asset);

  const { depositAPR, loading } = useFloatingPoolAPR(symbol, qty, 'deposit');

  React.useEffect(() => {
    if (txStatus === 'success') onSuccess?.(txHash);
  }, [onSuccess, txHash, txStatus]);

  if (txStatus) return <ModalGif status={txStatus} hash={txHash} tryAgain={deposit} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={marketAccount?.decimals ?? 18}
              onMax={onMax}
              onChange={handleInputChange}
              label={t('Your balance')}
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="deposit" />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoAPR
                label={t('Current Variable APR')}
                apr={loading ? undefined : toPercentage(depositAPR)}
                withIcon
                symbol={symbol}
              />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        <ModalRewards symbol={symbol} operation="deposit" />
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="deposit" variant="row" />
          <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="deposit" variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="deposit" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant={errorData.variant} message={errorData.message} />
        </Grid>
      )}
      {children}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation('deposit', { capitalize: true })}
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || isPreparing}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || isPreparing || errorData?.status}
          refreshOnSubmit={false}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(Deposit);

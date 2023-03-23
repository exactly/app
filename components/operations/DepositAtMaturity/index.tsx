import React, { FC, useEffect } from 'react';
import { formatFixed } from '@ethersproject/bignumber';

import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import useBalance from 'hooks/useBalance';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { toPercentage } from 'utils/utils';
import useAccountData from 'hooks/useAccountData';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import DateSelector from 'components/OperationsModal/DateSelector';
import ModalInfoFixedAPR from 'components/OperationsModal/Info/ModalInfoFixedAPR';
import ModalInfoFixedUtilizationRate from 'components/OperationsModal/Info/ModalInfoFixedUtilizationRate';
import ModalInfo from 'components/common/modal/ModalInfo';
import formatNumber from 'utils/formatNumber';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import useDepositAtMaturity from 'hooks/useDepositAtMaturity';

const DepositAtMaturity: FC = () => {
  const { operation } = useModalStatus();
  const {
    isLoading,
    onMax,
    handleInputChange,
    handleSubmitAction,
    deposit,
    updateAPR,
    optimalDepositAmount,
    rawSlippage,
    setRawSlippage,
    fixedRate,
    gtMaxYield,
    needsApproval,
    previewGasCost,
  } = useDepositAtMaturity();
  const { symbol, errorData, qty, gasCost, tx, requiresApproval, assetContract } = useOperationContext();
  const walletBalance = useBalance(symbol, assetContract);
  const { marketAccount } = useAccountData(symbol);

  useEffect(() => void updateAPR(), [updateAPR]);

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

  const decimals = marketAccount?.decimals ?? 18;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              symbol={symbol}
              decimals={decimals}
              onMax={onMax}
              onChange={handleInputChange}
              label="Your balance"
              amount={walletBalance}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <DateSelector />
            </ModalBoxCell>
            <ModalBoxCell>
              <ModalInfoFixedAPR fixedAPR={toPercentage(fixedRate)} />
            </ModalBoxCell>
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="deposit" />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalAdvancedSettings>
          {optimalDepositAmount && (
            <ModalInfo label="Optimal deposit amount" variant="row">
              {formatNumber(formatFixed(optimalDepositAmount, decimals), symbol)}
            </ModalInfo>
          )}
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
          <ModalInfoFixedUtilizationRate qty={qty} symbol={symbol} operation="depositAtMaturity" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {(errorData?.status || gtMaxYield) && (
        <Grid item mt={1}>
          {gtMaxYield && <ModalAlert variant="warning" message="You have reached the maximum yield possible" />}
          {errorData?.status && <ModalAlert variant="error" message={errorData.message} />}
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label="Deposit"
          symbol={symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || previewIsLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || previewIsLoading || errorData?.status}
          requiresApproval={requiresApproval}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(DepositAtMaturity);

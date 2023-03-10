import React, { FC } from 'react';

import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import useBalance from 'hooks/useBalance';
import useAccountData from 'hooks/useAccountData';
import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { ModalBox, ModalBoxRow, ModalBoxCell } from 'components/common/modal/ModalBox';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import { Grid } from '@mui/material';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalInfoTotalDeposits from 'components/OperationsModal/Info/ModalInfoTotalDeposits';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import useDeposit from 'hooks/useDeposit';
import ModalRewards from 'components/common/modal/ModalRewards';

const Deposit: FC = () => {
  const { operation } = useModalStatus();
  const { symbol, errorData, qty, gasCost, tx, requiresApproval, assetContract } = useOperationContext();
  const { isLoading, onMax, handleInputChange, handleSubmitAction, deposit, needsApproval, previewGasCost } =
    useDeposit();
  const { decimals = 18 } = useAccountData(symbol);
  const walletBalance = useBalance(symbol, assetContract);

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  if (tx) return <ModalGif tx={tx} tryAgain={deposit} />;

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
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation={operation} />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        {errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}
        <ModalRewards symbol={symbol} operation="deposit" />
        <ModalAdvancedSettings>
          <ModalInfoTotalDeposits qty={qty} symbol={symbol} operation="deposit" variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="deposit" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant="error" message={errorData.message} />
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

export default React.memo(Deposit);

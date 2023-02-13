import React, { type FC, useContext } from 'react';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalGif from 'components/common/modal/ModalGif';

import AccountDataContext from 'contexts/AccountDataContext';

import { useOperationContext, usePreviewTx } from 'contexts/OperationContext';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import { useModalStatus } from 'contexts/ModalStatusContext';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/common/modal/ModalSubmit';
import useAccountData from 'hooks/useAccountData';
import useBorrow from 'hooks/useBorrow';

const Borrow: FC = () => {
  const { operation } = useModalStatus();
  const { accountData } = useContext(AccountDataContext);
  const { symbol, errorData, qty, gasCost, tx, requiresApproval } = useOperationContext();
  const {
    isLoading,
    onMax,
    handleInputChange,
    handleSubmitAction,
    borrow,
    safeMaximumBorrow,
    needsApproval,
    previewGasCost,
  } = useBorrow();
  const { decimals = 18 } = useAccountData(symbol);

  const { isLoading: previewIsLoading } = usePreviewTx({ qty, needsApproval, previewGasCost });

  if (tx) return <ModalGif tx={tx} tryAgain={borrow} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              decimals={decimals}
              symbol={symbol}
              onMax={onMax}
              onChange={handleInputChange}
              label="Borrow limit"
              amount={safeMaximumBorrow}
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
        <ModalAdvancedSettings>
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="borrow" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={2}>
          <ModalAlert variant="error" message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={4}>
        <ModalSubmit
          label="Borrow"
          symbol={symbol === 'WETH' && accountData ? accountData[symbol].symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || previewIsLoading}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || previewIsLoading || errorData?.status}
          requiresApproval={requiresApproval}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(Borrow);

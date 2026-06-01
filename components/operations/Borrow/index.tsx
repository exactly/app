import React, { type FC } from 'react';
import { useTranslation } from 'react-i18next';
import ModalGif from 'components/OperationsModal/ModalGif';

import { useOperationContext } from 'contexts/OperationContext';
import { Grid } from '@mui/material';
import { ModalBox, ModalBoxCell, ModalBoxRow } from 'components/common/modal/ModalBox';
import AssetInput from 'components/OperationsModal/AssetInput';
import ModalInfoHealthFactor from 'components/OperationsModal/Info/ModalInfoHealthFactor';
import ModalInfoBorrowLimit from 'components/OperationsModal/Info/ModalInfoBorrowLimit';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalInfoFloatingUtilizationRate from 'components/OperationsModal/Info/ModalInfoFloatingUtilizationRate';
import ModalAlert from 'components/common/modal/ModalAlert';
import ModalSubmit from 'components/OperationsModal/ModalSubmit';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useBorrow from 'hooks/useBorrow';
import ModalRewards from 'components/OperationsModal/ModalRewards';
import ModalInfoAPR from 'components/OperationsModal/Info/ModalInfoAPR';
import { toPercentage } from 'utils/utils';
import useFloatingPoolAPR from 'hooks/useFloatingPoolAPR';
import useTranslateOperation from 'hooks/useTranslateOperation';

const Borrow: FC = () => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { symbol, errorData, qty } = useOperationContext();
  const { borrowAPR } = useFloatingPoolAPR(symbol, qty, 'borrow');
  const {
    isLoading,
    isPreparing,
    onMax,
    handleInputChange,
    handleSubmitAction,
    borrow,
    safeMaximumBorrow,
    txStatus,
    txHash,
  } = useBorrow();
  const marketAccount = usePreviewerExactly().data?.find((market) => market.assetSymbol === symbol);

  if (txStatus) return <ModalGif status={txStatus} hash={txHash} tryAgain={borrow} />;

  return (
    <Grid container flexDirection="column">
      <Grid item>
        <ModalBox>
          <ModalBoxRow>
            <AssetInput
              qty={qty}
              decimals={marketAccount?.decimals ?? 18}
              symbol={symbol}
              onMax={onMax}
              onChange={handleInputChange}
              label={t('Safe borrow limit')}
              amount={safeMaximumBorrow}
              tooltip={t('The maximum amount you can borrow without putting your health factor at risk')}
            />
          </ModalBoxRow>
          <ModalBoxRow>
            <ModalBoxCell>
              <ModalInfoHealthFactor qty={qty} symbol={symbol} operation="borrow" />
            </ModalBoxCell>
            <ModalBoxCell divisor>
              <ModalInfoAPR label={t('Current Variable APR')} apr={toPercentage(borrowAPR)} withIcon symbol={symbol} />
            </ModalBoxCell>
          </ModalBoxRow>
        </ModalBox>
      </Grid>

      <Grid item mt={2}>
        <ModalRewards symbol={symbol} operation="borrow" />
        <ModalAdvancedSettings>
          <ModalInfoBorrowLimit qty={qty} symbol={symbol} operation="borrow" variant="row" />
          <ModalInfoFloatingUtilizationRate qty={qty} symbol={symbol} operation="borrow" variant="row" />
        </ModalAdvancedSettings>
      </Grid>

      {errorData?.status && (
        <Grid item mt={1}>
          <ModalAlert variant={errorData.variant} message={errorData.message} />
        </Grid>
      )}

      <Grid item mt={{ xs: 2, sm: 3 }}>
        <ModalSubmit
          label={translateOperation('borrow', { capitalize: true })}
          symbol={symbol === 'WETH' && marketAccount ? marketAccount.symbol : symbol}
          submit={handleSubmitAction}
          isLoading={isLoading || isPreparing}
          disabled={!qty || parseFloat(qty) <= 0 || isLoading || isPreparing || errorData?.status}
          refreshOnSubmit={false}
        />
      </Grid>
    </Grid>
  );
};

export default React.memo(Borrow);

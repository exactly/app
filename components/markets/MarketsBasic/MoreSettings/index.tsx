import React, { FC, useMemo } from 'react';
import { Box } from '@mui/material';
import ModalAdvancedSettings from 'components/common/modal/ModalAdvancedSettings';
import ModalTxCost from 'components/common/modal/ModalTxCost';
import ModalInfoEditableSlippage from 'components/OperationsModal/Info/ModalInfoEditableSlippage';
import useDepositAtMaturity from 'hooks/useDepositAtMaturity';
import useBorrowAtMaturity from 'hooks/useBorrowAtMaturity';
import { useOperationContext } from 'contexts/OperationContext';
import { MarketsBasicOperation } from 'contexts/MarketsBasicContext';

type Props = {
  operation: MarketsBasicOperation;
};

const MoreSettings: FC<Props> = ({ operation }) => {
  const { rawSlippage: rawSlippageDeposit, setRawSlippage: setRawSlippageDeposit } = useDepositAtMaturity();
  const { rawSlippage: rawSlippageBorrow, setRawSlippage: setRawSlippageBorrow } = useBorrowAtMaturity();
  const { gasCost, errorData } = useOperationContext();

  const rawSlippage = useMemo(
    () => (operation === 'deposit' ? rawSlippageDeposit : rawSlippageBorrow),
    [operation, rawSlippageBorrow, rawSlippageDeposit],
  );
  const setRawSlippage = useMemo(
    () => (operation === 'deposit' ? setRawSlippageDeposit : setRawSlippageBorrow),
    [operation, setRawSlippageDeposit, setRawSlippageBorrow],
  );

  return (
    <>
      <Box>{errorData?.component !== 'gas' && <ModalTxCost gasCost={gasCost} />}</Box>
      <ModalAdvancedSettings bgColor="transparent" mt={0.5}>
        <Box mt={-1.5}>
          <ModalInfoEditableSlippage value={rawSlippage} onChange={(e) => setRawSlippage(e.target.value)} />
        </Box>
      </ModalAdvancedSettings>
    </>
  );
};

export default MoreSettings;

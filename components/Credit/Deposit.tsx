import React, { useEffect } from 'react';
import DepositOperation from '../operations/Deposit';
import { useOperationContext } from '../../contexts/OperationContext';
import { Box, Grid, Typography } from '@mui/material';
import ModalAlert from '../common/modal/ModalAlert';
import { useTranslation } from 'react-i18next';

type Props = {
  onNextStep: () => void;
};

const Deposit = ({ onNextStep }: Props) => {
  const { tx, setSymbol, setQty, setTx, setOperation } = useOperationContext();
  const { t } = useTranslation();

  useEffect(() => {
    setOperation('deposit');
    setSymbol('WETH');
    setQty('');
  }, [setOperation, setQty, setSymbol]);

  useEffect(() => {
    if (!tx || tx.status !== 'success') return;
    onNextStep();
    setTx(undefined);
  }, [onNextStep, setTx, tx]);

  return (
    <>
      <Typography fontSize={24} mb={1} fontWeight={700}>
        {t('Deposit Collateral')}
      </Typography>
      <Typography mb={6}>
        {t(
          'To increase your borrowing limit, you need to deposit assets. These deposits will automatically be enabled as collateral.',
        )}
      </Typography>
      <Box
        sx={({ palette }) => ({
          p: 3,
          bgcolor: 'components.bg',
          borderRadius: 2,
          boxShadow: palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '',
        })}
      >
        <DepositOperation>
          <Grid item mt={1}>
            <ModalAlert
              variant="warning"
              message={t(
                'After completing the deposit, you will need to enable it as collateral on the following screen.',
              )}
            />
          </Grid>
        </DepositOperation>
      </Box>
    </>
  );
};

export default Deposit;

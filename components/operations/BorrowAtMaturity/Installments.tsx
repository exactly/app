import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { useOperationContext } from 'contexts/OperationContext';
import { Box, Typography } from '@mui/material';
import { MATURITY_DAYS } from 'utils/utils';
import ModalAlert from 'components/common/modal/ModalAlert';
import InstallmentsOptions from './InstallmentsOptions';

export default function Installments({ setBreakdownSheetOpen }: { setBreakdownSheetOpen: (open: boolean) => void }) {
  const { t } = useTranslation();
  const { installments } = useOperationContext();

  const viewBreakdown = useCallback(() => {
    setBreakdownSheetOpen(true);
  }, [setBreakdownSheetOpen]);

  return (
    <Box display="flex" flexDirection="column" gap={2.5} flex={1}>
      <Box display="flex" justifyContent="space-between">
        <Box display="flex" gap={1} alignItems="center">
          <Typography
            fontSize={11}
            fontWeight={700}
            color="white"
            sx={{
              background: ({ palette }) => palette.green,
              borderRadius: '4px',
              px: 0.5,
              textTransform: 'uppercase',
            }}
          >
            {t('New!')}
          </Typography>
          <Typography fontFamily="fontFamilyMonospaced" color="grey.600" fontSize={12} fontWeight={500} noWrap>
            {t('Installments')}
          </Typography>
        </Box>
        <InstallmentsOptions />
      </Box>
      {installments >= 2 && (
        <ModalAlert
          variant="info"
          message={
            <>
              {t('Each installment is due every {{interval}} days.', {
                interval: MATURITY_DAYS.toString(),
              })}{' '}
              <a style={{ textDecorationLine: 'underline', cursor: 'pointer' }} onClick={viewBreakdown}>
                {t('Payment schedule')}
              </a>
            </>
          }
        />
      )}
    </Box>
  );
}

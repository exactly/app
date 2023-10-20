import React from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import { type FloatingPoolItemData } from '../../types/FloatingPoolItemData';
import FloatingPoolDashboardTable from '../dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable';

type Props = {
  onNextStep: () => void;
  hasCollateral: boolean;
  deposits: FloatingPoolItemData[];
};

const Collateral = ({ onNextStep, hasCollateral, deposits }: Props) => {
  const { t } = useTranslation();
  return (
    <Box display="flex" flexDirection="column" gap={6}>
      <Box>
        <Typography fontSize={24} fontWeight={700} mb={1}>
          {t('Enable Collateral')}
        </Typography>
        <Typography>{t('Enable one of your deposited assets as collateral to continue.')}</Typography>
      </Box>
      <Box
        sx={({ palette }) => ({
          p: 1,
          bgcolor: 'components.bg',
          borderRadius: 2,
          boxShadow: palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '',
        })}
      >
        <FloatingPoolDashboardTable rows={deposits} type={'deposit'} simple />
      </Box>
      <Button variant="contained" disabled={!hasCollateral} onClick={onNextStep}>
        {t('Next')}
      </Button>
    </Box>
  );
};

export default Collateral;

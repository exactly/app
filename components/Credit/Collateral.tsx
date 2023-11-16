import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Box, Button, Typography } from '@mui/material';
import FloatingPoolDashboardTable from '../dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable';
import useDashboard from '../../hooks/useDashboard';
import useAccountData from '../../hooks/useAccountData';

type Props = {
  onNextStep: () => void;
};

const Collateral = ({ onNextStep }: Props) => {
  const { t } = useTranslation();
  const { floatingRows } = useDashboard('deposit');
  const { getMarketAccount } = useAccountData();
  const deposits = useMemo(() => floatingRows.filter(({ valueUSD }) => valueUSD !== 0), [floatingRows]);
  const hasCollateral = useMemo(
    () => deposits.some((row) => getMarketAccount(row.symbol)?.isCollateral),
    [deposits, getMarketAccount],
  );
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

import React, { useEffect } from 'react';
import { Box, Grid, Typography } from '@mui/material';

import FixedPoolDashboardTable from 'components/dashboard/DashboardContent/FixedPoolDashboard/FixedPoolDashboardTable';
import useDashboard from 'hooks/useDashboard';
import { useTranslation } from 'react-i18next';
import InfoIcon from '@mui/icons-material/Info';
import getHourUTC2Local from 'utils/getHourUTC2Local';
import useAnalytics from 'hooks/useAnalytics';

type Props = {
  type: 'deposit' | 'borrow';
};

function FixedPoolDashboard({ type }: Props) {
  const { t } = useTranslation();
  const { fixedRows } = useDashboard(type);

  const {
    list: { viewItemListDashboard },
  } = useAnalytics();

  useEffect(() => {
    if (fixedRows.length) {
      viewItemListDashboard(fixedRows, 'fixed', type);
    }
  }, [fixedRows, viewItemListDashboard, type]);

  return (
    <Grid
      width={'100%'}
      mb="16px"
      p="24px"
      boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
      borderRadius="0px 0px 6px 6px"
      bgcolor="components.bg"
      borderTop="4px solid #008CF4"
    >
      <Box display="flex" justifyContent="space-between" flexWrap="wrap">
        <Typography variant="h6">{t('Fixed Interest Rate')}</Typography>
        <Box display="flex" alignItems="center">
          <InfoIcon sx={{ color: 'blue', height: 14 }} />
          <Typography fontSize={13} fontWeight={500} color="blue">
            {t('Fixed borrows are due at {{hour}} on maturity date.', { hour: getHourUTC2Local() })}
          </Typography>
        </Box>
      </Box>

      {fixedRows.length === 0 ? (
        <Typography color="grey.500" mt={1} fontSize="14px">
          {t('No {{operations}} found', { operations: type === 'deposit' ? t('deposits') : t('borrows') })}
        </Typography>
      ) : (
        <FixedPoolDashboardTable rows={fixedRows} type={type} />
      )}
    </Grid>
  );
}

export default FixedPoolDashboard;

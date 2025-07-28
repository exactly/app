import React from 'react';

import AddExaTokensButton from 'components/AddExaTokensButton';

import FloatingPoolDashboardTable from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable';
import { Grid, Typography } from '@mui/material';
import Stack from '@mui/material/Stack';
import useDashboard from 'hooks/useDashboard';
import { useTranslation } from 'react-i18next';

type Props = {
  type: 'deposit' | 'borrow';
};

function FloatingPoolDashboard({ type }: Props) {
  const { t } = useTranslation();
  const { floatingRows } = useDashboard(type);

  return (
    <Grid
      width="100%"
      mb={2}
      px={1.5}
      py={3}
      boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
      borderRadius="0px 0px 6px 6px"
      bgcolor="components.bg"
      borderTop="4px solid #34C53A"
    >
      <Stack direction="row" spacing={2} alignItems="center">
        <Typography variant="h6" ml={1.5}>
          {t('Variable Interest Rate')}
        </Typography>
        <AddExaTokensButton />
      </Stack>

      {floatingRows.length === 0 ? (
        <Typography color="grey.500" mt={1} fontSize="14px" mx={1.5}>
          {t('No {{operations}} found', { operations: type === 'deposit' ? t('deposits') : t('borrows') })}
        </Typography>
      ) : (
        <FloatingPoolDashboardTable rows={floatingRows} type={type} />
      )}
    </Grid>
  );
}

export default FloatingPoolDashboard;

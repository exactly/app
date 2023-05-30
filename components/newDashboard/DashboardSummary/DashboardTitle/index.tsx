import React, { useEffect, useState } from 'react';
import { Box, IconButton, Skeleton, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReplayIcon from '@mui/icons-material/Replay';
import { useTranslation } from 'react-i18next';
import useAccountData from 'hooks/useAccountData';
import dayjs from 'dayjs';

const DashboardTitle = () => {
  const { t } = useTranslation();
  const { refreshAccountData, lastSync } = useAccountData();
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState(dayjs(Date.now()).diff(lastSync, 'minutes'));

  const refreshData = async () => {
    setLoading(true);
    await refreshAccountData();
    setLoading(false);
  };

  useEffect(() => {
    const updateMinutes = () => setMinutes(dayjs(Date.now()).diff(lastSync, 'minutes'));
    updateMinutes();

    const interval = setInterval(updateMinutes, 60 * 1000);
    return () => clearInterval(interval);
  }, [lastSync]);

  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
      <Box display="flex" alignItems="center" gap={1}>
        <AssignmentIcon />
        <Typography variant="h6">{t('Summary')}</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.25}>
        {loading ? (
          <Skeleton width={160} />
        ) : (
          <Typography variant="dashboardMainSubtitle" textAlign="right">
            {t('Updated {{minutes}} minutes ago', { minutes })}
          </Typography>
        )}

        <IconButton size="small" onClick={refreshData} disabled={loading}>
          <ReplayIcon sx={{ fontSize: 20, color: 'figma.grey.500' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardTitle;

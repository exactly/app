import React, { useEffect, useState } from 'react';
import { Box, IconButton, Skeleton, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReplayIcon from '@mui/icons-material/Replay';
import { useTranslation } from 'react-i18next';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import dayjs from 'dayjs';
import { track } from 'utils/mixpanel';

const DashboardTitle = () => {
  const { t } = useTranslation();
  const { refetch, dataUpdatedAt } = usePreviewerExactly();
  const [loading, setLoading] = useState(false);
  const [minutes, setMinutes] = useState(dataUpdatedAt ? dayjs(Date.now()).diff(dataUpdatedAt, 'minutes') : 0);

  const refreshData = async () => {
    setLoading(true);
    await refetch();
    setLoading(false);
    track('Button Clicked', {
      name: 'refresh',
      location: 'Dashboard',
      icon: 'Replay',
    });
  };

  useEffect(() => {
    const updateMinutes = () => setMinutes(dataUpdatedAt ? dayjs(Date.now()).diff(dataUpdatedAt, 'minutes') : 0);
    updateMinutes();

    const interval = setInterval(updateMinutes, 60 * 1000);
    return () => clearInterval(interval);
  }, [dataUpdatedAt]);

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
            {minutes < 1
              ? t('Updated <1 minute ago')
              : minutes < 2
                ? t('Updated 1 minute ago')
                : t('Updated {{minutes}} minutes ago', { minutes })}
          </Typography>
        )}

        <IconButton
          size="small"
          onClick={refreshData}
          disabled={loading}
          sx={
            loading
              ? {
                  animation: 'spin 1s linear infinite',
                  '@keyframes spin': {
                    '0%': {
                      transform: 'rotate(360deg)',
                    },
                    '100%': {
                      transform: 'rotate(0deg)',
                    },
                  },
                }
              : {}
          }
        >
          <ReplayIcon sx={{ fontSize: 20, color: 'figma.grey.500' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardTitle;

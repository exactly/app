import React from 'react';
import { Box, IconButton, Typography } from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ReplayIcon from '@mui/icons-material/Replay';
import { useTranslation } from 'react-i18next';

const DashboardTitle = () => {
  const { t } = useTranslation();
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" mb={0.5}>
      <Box display="flex" alignItems="center" gap={1}>
        <AssignmentIcon />
        <Typography variant="h6">{t('Summary')}</Typography>
      </Box>
      <Box display="flex" alignItems="center" gap={0.25}>
        <Typography variant="dashboardMainSubtitle" textAlign="right">
          {t('Updated {{minutes}} minutes ago', { minutes: 10 })}
        </Typography>
        <IconButton size="small">
          <ReplayIcon sx={{ fontSize: 20, color: 'figma.grey.500' }} />
        </IconButton>
      </Box>
    </Box>
  );
};

export default DashboardTitle;

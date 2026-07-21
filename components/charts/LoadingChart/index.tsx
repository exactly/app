import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

function LoadingChart({ overlay = false }: { overlay?: boolean }) {
  const { t } = useTranslation();
  return (
    <Box
      data-testid="loading-chart"
      display="flex"
      width="100%"
      height="100%"
      sx={
        overlay
          ? {
              position: 'absolute',
              inset: 0,
              zIndex: 1,
            }
          : undefined
      }
    >
      <Box
        display="flex"
        alignItems="center"
        m="auto"
        gap={1}
        px={2}
        py={1}
        bgcolor="grey.200"
        border="1px solid"
        borderColor="grey.300"
        borderRadius="999px"
        boxShadow="0 2px 8px rgb(0 0 0 / 18%)"
      >
        <CircularProgress sx={{ color: 'text.primary' }} size={18} thickness={4} />
        <Typography color="text.primary" variant="subtitle2" fontSize="14px" lineHeight={1}>
          {t('Loading data...')}
        </Typography>
      </Box>
    </Box>
  );
}

export default LoadingChart;

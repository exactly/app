import React from 'react';
import { Box, CircularProgress, Typography } from '@mui/material';

function LoadingChart() {
  return (
    <Box display="flex" width="100%" height="100%">
      <Box display="flex" flexDirection="column" justifyContent="center" m="auto" gap={1}>
        <CircularProgress sx={{ color: 'grey.500', mx: 'auto' }} size={24} thickness={4} />
        <Typography color="grey.500" variant="h6" fontSize="16px">
          Loading data...
        </Typography>
      </Box>
    </Box>
  );
}

export default LoadingChart;

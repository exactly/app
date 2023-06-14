import React from 'react';

import { Box, Button, Typography } from '@mui/material';
import { useStartLeverager } from 'hooks/useActionButton';

const Leverager = () => {
  const { startLeverager } = useStartLeverager();

  return (
    <Box
      display="flex"
      alignItems="center"
      justifyContent="space-between"
      bgcolor="components.bg"
      mt={2}
      p={3}
      boxShadow={'0px 4px 12px rgba(175, 177, 182, 0.2)'}
    >
      <Typography variant="h6">Control Your Leverage</Typography>
      <Box display="flex" gap={1}>
        <Button variant="contained" onClick={() => startLeverager()}>
          Leverage
        </Button>
      </Box>
    </Box>
  );
};

export default Leverager;

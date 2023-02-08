import React, { FC } from 'react';
import { Box, Typography } from '@mui/material';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

const MoreSettings: FC = () => {
  return (
    <>
      <Box display="flex" justifyContent="space-between">
        <Typography variant="modalRow" color="grey.500">
          TX Cost
        </Typography>
        <Box display="flex" gap={0.5}>
          <Typography variant="modalRow">~$2.44</Typography>
          <Typography variant="modalRow" color="grey.500">
            (18 Gwei)
          </Typography>
        </Box>
      </Box>
      <Box display="flex" gap={0.3}>
        <Typography variant="modalRow" color="grey.500">
          Advanced settings
        </Typography>
        <ChevronRightIcon sx={{ fontSize: '14px', color: 'grey.500', my: 'auto' }} />
      </Box>
    </>
  );
};

export default MoreSettings;

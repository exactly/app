import React from 'react';
import { Box, Typography } from '@mui/material';
import PublishIcon from '@mui/icons-material/Publish';

const BorrowLimit = () => {
  return (
    <Box
      display="flex"
      justifyContent="space-between"
      alignItems="center"
      py={3}
      px={4}
      gap={3}
      borderRadius="8px"
      boxSizing="border-box"
      bgcolor="#FFFFFF"
    >
      <Box display="flex" gap={1} alignItems="center">
        <PublishIcon sx={{ fontSize: 16 }} />
        <Typography variant="dashboardTitle">Borrow Limit</Typography>
      </Box>
      <Typography variant="dashboardMainTitle">~$3.5M</Typography>
    </Box>
  );
};

export default BorrowLimit;

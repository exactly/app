import React from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';

const TopBar = () => {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: 'blue',
        color: 'white',
        height: 'auto',
        width: '100%',
        px: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flexDirection: { xs: 'column', sm: 'row' },
          padding: '24px',
          width: '100%',
        }}
        gap={3}
      >
        <Typography fontSize={24} fontWeight={700} variant="modalRow" color="white">
          IMPORTANT
        </Typography>
        <Typography fontSize={20} variant="modalRow" color="white">
          The protocol is currently{' '}
          <a style={{ textDecoration: 'underline' }} href="https://docs.exact.ly/security/access-control#pauser">
            paused
          </a>
          . Withdraws are active. Follow updates on official social networks.
        </Typography>
      </Box>
    </Box>
  );
};

export default TopBar;

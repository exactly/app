import React from 'react';
import { Box, useTheme } from '@mui/material';
import { globals } from 'styles/theme';

const { onlyDesktop } = globals;
export default function BackgroundCircle() {
  const { palette } = useTheme();
  return (
    <Box
      sx={{
        display: onlyDesktop,
        paddingTop: '108px',
        width: '100vh',
        height: '100vh',
        position: 'absolute',
        overflowY: 'hidden',
        top: 0,
        transform: 'translateX(50%)',
        zIndex: -1,
        right: '50%',
      }}
    >
      <Box
        sx={{
          width: '100vh',
          height: '100vh',
          background: `linear-gradient(0deg, ${palette.grey[100]} 0%, rgba(249, 250, 251, 0) 100%)`,
          borderRadius: '50%',
          opacity: 0.8,
        }}
      />
    </Box>
  );
}

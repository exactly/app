import React, { memo, useCallback } from 'react';

import { Box, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import ReviewRoute from './ReviewRoute';
import SelectRoute from './SelectRoute';
import { useGetEXA, Screen } from 'contexts/GetEXAContext';
import TXStatus from './TXStatus';
import { track } from 'utils/segment';

const GetEXA = () => {
  const { screen, setScreen } = useGetEXA();
  const handleClose = useCallback(() => {
    setScreen(Screen.SELECT_ROUTE);
    track('Button Clicked', {
      location: 'Get EXA',
      name: 'close',
      icon: 'Close',
    });
    track('Modal Closed', {
      name: 'Get EXA',
    });
  }, [setScreen]);

  return (
    <Box
      position="relative"
      p={4}
      display="flex"
      flexDirection="column"
      bgcolor={'components.bg'}
      borderRadius={1}
      gap={4}
      flex={1}
      boxShadow={({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '')}
    >
      {screen !== Screen.SELECT_ROUTE && (
        <IconButton
          aria-label="close"
          onClick={handleClose}
          sx={{
            padding: 0,
            ml: 'auto',
            color: 'grey.900',
            mb: '-51px',
            zIndex: 2,
          }}
        >
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
      )}
      {
        {
          [Screen.SELECT_ROUTE]: <SelectRoute />,
          [Screen.REVIEW_ROUTE]: <ReviewRoute />,
          [Screen.TX_STATUS]: <TXStatus />,
        }[screen]
      }
    </Box>
  );
};

export default memo(GetEXA);

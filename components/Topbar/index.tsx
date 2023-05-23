import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { useNetworkContext } from 'contexts/NetworkContext';

const TopBar = () => {
  const [showBar, setShowBar] = useState(true);
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { displayNetwork } = useNetworkContext();

  const now = Math.floor(Date.now() / 1000);

  const handleClose = () => {
    setShowBar(false);
  };

  return showBar && displayNetwork.id === 10 ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        bgcolor: palette.orange,
        color: 'white',
        height: { xs: '64px', sm: '32px' },
        width: '100%',
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          padding: '0 16px',
          width: '100%',
        }}
      >
        <Typography variant="modalRow" color="white">
          {t('OP Mainnet upgrade to Bedrock release: June 6, 2023, 16:00 UTC. 2-4 hours downtime expected.')}{' '}
          <Typography variant="link" color="white" sx={{ textDecoration: 'underline' }}>
            <a target="_blank" rel="noreferrer noopener" href="https://www.optimism.io/bedrock-upgrade">
              {t('more info')}
            </a>
          </Typography>
        </Typography>
      </Box>
      <Box>
        {now < 1686067200 && (
          <IconButton edge="end" color="inherit" aria-label="close" size="small" onClick={handleClose}>
            <CloseIcon fontSize="inherit" />
          </IconButton>
        )}
      </Box>
    </Box>
  ) : null;
};

export default TopBar;

import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material';
import { Trans, useTranslation } from 'react-i18next';
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
        bgcolor: palette.orange,
        color: 'white',
        height: { xs: '80px', sm: '32px' },
        width: '100%',
        px: 1,
      }}
    >
      <Box
        sx={{
          display: 'flex',
          justifyContent: 'center',
          padding: '16px',
          width: '100%',
        }}
      >
        <Typography variant="modalRow" color="white">
          <Trans>
            {t(
              'The Optimism Mainnet upgrade to the Bedrock release will take place on <strong>{{date}}</strong> There will be 2-4 hours of downtime.',
              {
                date: t('June 6, 2023 at 16:00 UTC.'),
              },
            )}{' '}
          </Trans>
          <Typography variant="link" color="white" sx={{ textDecoration: 'underline' }}>
            <a target="_blank" rel="noreferrer noopener" href="https://www.optimism.io/bedrock-upgrade">
              {t('More info')}
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

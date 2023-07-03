import React, { useState } from 'react';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import { useTheme } from '@mui/material';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';

const TopBar = () => {
  const { palette } = useTheme();
  const { t } = useTranslation();
  const { query } = useRouter();

  const now = Math.floor(Date.now() / 1000);
  const expiration = 1688860800;
  const [showBar, setShowBar] = useState(now <= expiration);

  const handleClose = () => {
    localStorage.setItem('topbar_rollover', 'true');
    setShowBar(false);
  };

  const seen = localStorage.getItem('topbar_rollover');

  return showBar && !seen ? (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        bgcolor: palette.green,
        color: 'white',
        height: { xs: '64px', sm: '32px' },
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
        gap={1}
      >
        <Box
          width="fit-content"
          display="flex"
          alignItems="center"
          alignSelf="center"
          height="16px"
          py="3px"
          px="6px"
          borderRadius="8px"
          sx={{ background: 'white', textTransform: 'uppercase' }}
        >
          <Typography variant="chip" color={palette.green}>
            {t('New')}
          </Typography>
        </Box>
        <Typography variant="modalRow" color="white">
          {t('Unlock better loan terms with the new Rollover feature.')}
          {` `}
          <Typography variant="link" color="white" sx={{ textDecoration: 'underline' }}>
            <Link href={{ pathname: '/dashboard', query }} onClick={() => handleClose()}>
              <Typography variant="link" color="white" sx={{ textDecoration: 'underline' }}>
                {t('Try it out now!')}
              </Typography>
            </Link>
          </Typography>
        </Typography>
      </Box>
      <Box>
        <IconButton edge="end" color="inherit" aria-label="close" size="small" onClick={handleClose}>
          <CloseIcon fontSize="inherit" />
        </IconButton>
      </Box>
    </Box>
  ) : null;
};

export default TopBar;

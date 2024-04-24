import React, { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Box, Button, Typography, useMediaQuery, useTheme } from '@mui/material';
import { ChevronRight, Close } from '@mui/icons-material';
import { useTranslation } from 'react-i18next';

export default function EXACard() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(true);
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  const handleClose = useCallback(() => {
    if (!window) return;
    setOpen(false);
    window.localStorage.setItem('exaCard', 'closed');
  }, []);

  useEffect(() => {
    if (!window) return;
    const exaCard = window.localStorage.getItem('exaCard');
    if (exaCard === 'closed') {
      setOpen(false);
    }
  }, []);

  if (!open) return null;

  return (
    <Box position="fixed" bottom={0} left={0} px={3} pb={3}>
      <Box
        display="flex"
        gap={3}
        height={100}
        alignItems="center"
        borderRadius={1}
        pl={1}
        pr={2}
        width={isMobile ? '100%' : '312px'}
        bgcolor={isMobile ? 'black' : 'transparent'}
        sx={{
          '&:hover > *': {
            opacity: 1,
          },
          '&:hover': {
            backgroundColor: 'black',
          },
          transition: 'background-color 0.3s',
        }}
        position="relative"
      >
        <Image src="/exa-card.svg" width={108} height={90} alt="exa card" />
        <Box
          sx={
            isMobile
              ? {}
              : {
                  opacity: 0,
                  transition: 'opacity 0.3s',
                }
          }
        >
          <Button
            variant="outlined"
            onClick={handleClose}
            sx={{
              position: 'absolute',
              top: 0,
              right: 0,
              bgcolor: 'white',
              width: 16,
              minWidth: 16,
              height: 16,
              p: '10px',
              color: 'black',
              border: '2px solid black',
              '&:hover': {
                text: 'white',
                opacity: 1,
                bgcolor: 'white',
                border: '2px solid black',
              },
              mr: '-8px',
              mt: '-8px',
            }}
          >
            <Close fontSize={'small'} />
          </Button>
          <Typography fontSize={16} fontWeight={700} color="white">
            {t('The first onchain debit & credit card.')}
          </Typography>
          <Link href="https://exactly.app" target="_blank">
            <Box display="flex" alignItems="center" color="#12A594" fontSize={14} fontWeight={500}>
              {t('Join the waitlist')}
              <ChevronRight />
            </Box>
          </Link>
        </Box>
      </Box>
    </Box>
  );
}

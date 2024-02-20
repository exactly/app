import React from 'react';

import Link from 'next/link';
import CloseIcon from '@mui/icons-material/Close';
import { Trans, useTranslation } from 'react-i18next';
import { Box, Drawer, IconButton, Typography } from '@mui/material';

import GetEXA from '.';
import { useModal } from '../../contexts/ModalContext';
import { GetEXAProvider } from 'contexts/GetEXAContext';
import { track } from 'utils/mixpanel';

export default function ModalWrapper() {
  const { isOpen, close } = useModal('get-exa');
  const { t } = useTranslation();
  if (!isOpen) return null;
  return (
    <Drawer
      open={isOpen}
      onClose={close}
      SlideProps={{
        appear: true,
        direction: 'right',
      }}
      PaperProps={{
        sx: {
          bgcolor: ({ palette: { mode } }) => (mode === 'light' ? 'grey.100' : 'black'),
        },
      }}
    >
      <IconButton onClick={close} sx={{ position: 'absolute', right: 8, top: 8 }}>
        <CloseIcon />
      </IconButton>
      <Box maxWidth={576} paddingX={6} paddingY={7}>
        <Typography fontWeight={700} fontSize={24} mb={3}>
          {t(`Get EXA`)}
        </Typography>
        <Typography fontWeight={500} fontSize={16} mb={5}>
          <Trans
            i18nKey="Getting EXA gives you the ability to make the most of the Protocol's offerings, actively engaging in <a>Governance</a>, or joining the community as an EXA holder."
            components={{
              a: (
                <Link
                  href="/governance"
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    textDecoration: 'underline',
                  }}
                  onClick={() =>
                    track('Button Clicked', {
                      location: 'Get EXA ',
                      name: 'governance',
                      href: '/governance',
                    })
                  }
                >
                  {t('Governance')}
                </Link>
              ),
            }}
          />
        </Typography>
        <GetEXAProvider>
          <GetEXA />
        </GetEXAProvider>
      </Box>
    </Drawer>
  );
}

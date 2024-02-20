import React, { useCallback } from 'react';
import CloseIcon from '@mui/icons-material/Close';
import { Dialog, useTheme, IconButton, DialogTitle, DialogContent, Typography, Box } from '@mui/material';
import { useTranslation } from 'react-i18next';
import { goerli } from 'wagmi/chains';

import Faucet from './';
import { useModal } from 'contexts/ModalContext';
import { useWeb3 } from 'hooks/useWeb3';
import { track } from 'utils/mixpanel';

type Props = {
  isOpen: boolean;
  onClose: () => void;
};

function Modal({ isOpen, onClose }: Props) {
  const { t } = useTranslation();
  const { palette, spacing } = useTheme();
  const handleClose = useCallback(() => {
    onClose();
    track('Modal Closed', {
      name: 'faucet',
    });
  }, [onClose]);

  return (
    <Dialog open={isOpen} onClose={handleClose}>
      <IconButton
        aria-label="close"
        onClick={onClose}
        sx={{
          position: 'absolute',
          right: 4,
          top: 8,
          color: 'grey.500',
        }}
        data-testid="modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          borderTop: `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
        }}
      >
        <DialogTitle
          sx={{
            p: 0,
            mb: { xs: 2, sm: 3 },
          }}
        >
          <Typography fontWeight={700} fontSize={24} data-testid="modal-title">
            {t('Faucet')}
          </Typography>
        </DialogTitle>
        <DialogContent sx={{ padding: spacing(4, 0, 0, 0) }}>
          <Faucet />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

export default function ModalWrapper() {
  const { chain } = useWeb3();
  const { isOpen, close } = useModal('faucet');
  if (!isOpen || chain.id !== goerli.id) return null;

  return <Modal isOpen={isOpen} onClose={close} />;
}

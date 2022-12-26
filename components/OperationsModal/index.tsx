import React from 'react';

import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography, capitalize, useTheme } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useModalStatus } from 'contexts/ModalStatusContext';
import OperationContainer from './OperationContainer';
import TypeSwitch from './TypeSwitch';

function OperationsModal() {
  const theme = useTheme();
  const { open, closeModal, operation } = useModalStatus();

  return (
    <Dialog open={open} onClose={closeModal} sx={{ '& .MuiPaper-root': { maxWidth: 'fit-content' } }}>
      <IconButton
        aria-label="close"
        onClick={closeModal}
        sx={{
          position: 'absolute',
          right: 4,
          top: 8,
          color: 'grey.500',
        }}
      >
        <CloseIcon sx={{ fontSize: 16 }} />
      </IconButton>
      <Box sx={{ padding: theme.spacing(5, 4, 4), borderTop: '4px #000 solid' }}>
        <DialogTitle sx={{ p: 0, display: 'flex', justifyContent: 'space-between', mb: 4 }}>
          <Typography fontWeight={700} fontSize={24}>
            {capitalize(operation?.replaceAll('AtMaturity', '') ?? '')}
          </Typography>
          {operation !== 'faucet' && <TypeSwitch />}
        </DialogTitle>
        <DialogContent sx={{ padding: theme.spacing(4, 0, 0, 0) }}>
          <OperationContainer />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

export default OperationsModal;

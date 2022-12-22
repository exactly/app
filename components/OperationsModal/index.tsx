import React from 'react';

import { Box, Dialog, DialogContent, DialogTitle, IconButton, Typography, capitalize } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useModalStatus } from 'contexts/ModalStatusContext';
import OperationContainer from './OperationContainer';
import TypeSwitch from './TypeSwitch';

function OperationsModal() {
  const { open, closeModal, operation } = useModalStatus();

  return (
    <Dialog open={open} onClose={closeModal}>
      <IconButton
        aria-label="close"
        onClick={closeModal}
        sx={{
          position: 'absolute',
          right: 4,
          top: 4,
          color: 'grey.500',
        }}
      >
        <CloseIcon fontSize="small" />
      </IconButton>
      <Box sx={{ maxWidth: 488, padding: '40px 32px 32px', borderTop: '4px #000 solid' }}>
        <DialogTitle sx={{ p: 0, display: 'flex', justifyContent: 'space-between' }}>
          <Typography fontWeight={700} fontSize={24}>
            {capitalize(operation?.replaceAll('AtMaturity', '') ?? '')}
          </Typography>
          <TypeSwitch />
        </DialogTitle>
        <DialogContent sx={{ padding: '32px 0 0 0' }}>
          <OperationContainer />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

export default OperationsModal;

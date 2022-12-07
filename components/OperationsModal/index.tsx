import React from 'react';

import OperationsSelector from './OperationsSelector';
import OperationContainer from './OperationContainer';

import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { useModalStatus } from 'contexts/ModalStatusContext';

function OperationsModal() {
  const { open, closeModal } = useModalStatus();

  return (
    <Dialog open={open} onClose={closeModal}>
      <DialogContent sx={{ display: 'flex' }}>
        <IconButton
          aria-label="close"
          onClick={closeModal}
          sx={{
            position: 'absolute',
            right: 10,
            top: 10,
            color: (theme) => theme.palette.grey[500],
          }}
        >
          <CloseIcon />
        </IconButton>
        <OperationsSelector />
        <OperationContainer />
      </DialogContent>
    </Dialog>
  );
}

export default OperationsModal;

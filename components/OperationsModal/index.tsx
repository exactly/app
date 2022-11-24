import React, { useContext } from 'react';

import OperationsSelector from './OperationsSelector';
import OperationContainer from './OperationContainer';

import ModalStatusContext from 'contexts/ModalStatusContext';

import { Dialog, DialogContent, IconButton } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

function OperationsModals() {
  const { open, setOpen } = useContext(ModalStatusContext);

  return (
    <Dialog open={open} onClose={() => setOpen(false)}>
      <DialogContent sx={{ display: 'flex' }}>
        <IconButton
          aria-label="close"
          onClick={() => setOpen(false)}
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

export default OperationsModals;

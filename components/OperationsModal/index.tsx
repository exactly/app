import React, { useContext } from 'react';

import OperationsSelector from './OperationsSelector';
import OperationContainer from './OperationContainer';

import ModalStatusContext from 'contexts/ModalStatusContext';

import { Dialog, DialogContent } from '@mui/material';

function OperationsModals() {
  const { open, setOpen } = useContext(ModalStatusContext);

  const handleClose = () => {
    setOpen(false);
  };

  return (
    <Dialog open={open} onClose={handleClose}>
      <DialogContent sx={{ display: 'flex' }}>
        <OperationsSelector />
        <OperationContainer />
      </DialogContent>
    </Dialog>
  );
}

export default OperationsModals;

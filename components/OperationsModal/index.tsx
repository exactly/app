import React from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  capitalize,
  useTheme,
  PaperProps,
  Paper,
  useMediaQuery,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useModalStatus } from 'contexts/ModalStatusContext';
import OperationContainer from './OperationContainer';
import TypeSwitch from './TypeSwitch';
import { OperationContextProvider } from 'contexts/OperationContext';
import Draggable from 'react-draggable';

function PaperComponent(props: PaperProps | undefined) {
  return (
    <Draggable handle="#draggable-dialog-title" cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} />
    </Draggable>
  );
}

function OperationsModal() {
  const theme = useTheme();
  const { open, closeModal, operation } = useModalStatus();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));

  return (
    <Dialog
      open={open}
      onClose={closeModal}
      PaperComponent={isMobile ? undefined : PaperComponent}
      aria-labelledby="draggable-dialog-title"
    >
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
        <OperationContextProvider>
          <DialogTitle
            sx={{ p: 0, display: 'flex', justifyContent: 'space-between', mb: 4, cursor: { xs: '', sm: 'move' } }}
            id="draggable-dialog-title"
          >
            <Typography fontWeight={700} fontSize={24}>
              {capitalize(operation?.replaceAll('AtMaturity', '') ?? '')}
            </Typography>
            <TypeSwitch />
          </DialogTitle>
          <DialogContent sx={{ padding: theme.spacing(4, 0, 0, 0) }}>
            <OperationContainer />
          </DialogContent>
        </OperationContextProvider>
      </Box>
    </Dialog>
  );
}

export default OperationsModal;

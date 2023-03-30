'use client';

import React, { forwardRef, ReactElement, Ref, useMemo, useRef } from 'react';

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
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useModalStatus } from 'contexts/ModalStatusContext';
import OperationContainer from './OperationContainer';
import TypeSwitch from './TypeSwitch';
import Draggable from 'react-draggable';
import { TransitionProps } from '@mui/material/transitions';
import { useOperationContext } from 'contexts/OperationContext';

function PaperComponent(props: PaperProps | undefined) {
  const { tx } = useOperationContext();

  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper
        ref={ref}
        {...props}
        sx={{
          borderRadius: tx ? '16px' : '6px',
          minWidth: '400px',
          boxShadow: tx ? '4px 8px 16px rgba(227, 229, 232, 0.5), -4px -8px 16px rgba(248, 249, 249, 0.25)' : '',
        }}
      />
    </Draggable>
  );
}

const Transition = forwardRef(function Transition(
  props: TransitionProps & {
    children: ReactElement;
  },
  ref: Ref<unknown>,
) {
  return <Slide direction="up" ref={ref} {...props} />;
});

function OperationsModal() {
  const { breakpoints, spacing, palette } = useTheme();
  const { open, closeModal, operation } = useModalStatus();
  const { tx } = useOperationContext();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);

  return (
    <Dialog
      open={open}
      onClose={loadingTx ? undefined : closeModal}
      PaperComponent={isMobile ? undefined : PaperComponent}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
      BackdropProps={{ style: { backgroundColor: tx ? 'rgb(100, 100, 100 , 0.1)' : '' } }}
      disableEscapeKeyDown={loadingTx}
      data-testid="modal"
    >
      {!loadingTx && (
        <IconButton
          aria-label="close"
          onClick={closeModal}
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
      )}
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          borderTop: tx ? '' : `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
        }}
      >
        {!tx && (
          <DialogTitle
            sx={{
              p: 0,
              display: 'flex',
              justifyContent: 'space-between',
              mb: { xs: 2, sm: 3 },
              cursor: { xs: '', sm: 'move' },
            }}
            id="draggable-dialog-title"
          >
            <Typography fontWeight={700} fontSize={24} data-testid="modal-title">
              {capitalize(operation?.replaceAll('AtMaturity', '') ?? '')}
            </Typography>
            <TypeSwitch />
          </DialogTitle>
        )}
        <DialogContent sx={{ padding: spacing(4, 0, 0, 0) }}>
          <OperationContainer operation={operation} />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

export default OperationsModal;

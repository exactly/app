import React, { forwardRef, ReactElement, Ref, useCallback, useMemo, useRef } from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Typography,
  useTheme,
  PaperProps,
  Paper,
  useMediaQuery,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import OperationContainer from './OperationContainer';
import TypeSwitch from './TypeSwitch';
import Draggable from 'react-draggable';
import { TransitionProps } from '@mui/material/transitions';
import { OperationContextProvider, useOperationContext } from 'contexts/OperationContext';
import useTranslateOperation from 'hooks/useTranslateOperation';
import useAnalytics from 'hooks/useAnalytics';
import useDelayedEffect from 'hooks/useDelayedEffect';
import { useModal } from 'contexts/ModalContext';
import { track } from '../../utils/segment';

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
          boxShadow: ({ palette }) =>
            palette.mode === 'light' && tx
              ? '4px 8px 16px rgba(227, 229, 232, 0.5), -4px -8px 16px rgba(248, 249, 249, 0.25)'
              : '',
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

type Props = {
  isOpen: boolean;
  close: () => void;
};

function OperationsModal({ isOpen, close }: Props) {
  const translateOperation = useTranslateOperation();
  const { breakpoints, spacing, palette } = useTheme();
  const { operation, tx, date } = useOperationContext();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);
  const {
    list: { viewItem },
  } = useAnalytics();

  const viewEffect = useCallback(() => {
    if (isOpen && date) {
      viewItem(date);
    }
  }, [date, isOpen, viewItem]);

  useDelayedEffect({ effect: viewEffect });

  const handleCloseButtonClick = useCallback(() => {
    track('Button Clicked', {
      location: 'Operations Modal',
      icon: 'Close',
      name: 'close',
    });
    close();
  }, [close]);

  const handleClose = useCallback(() => {
    if (loadingTx) return;
    close();
    track('Modal Closed', {
      name: 'operations',
      operation,
    });
  }, [close, loadingTx, operation]);

  return (
    <Dialog
      open={isOpen}
      onClose={handleClose}
      PaperComponent={isMobile ? undefined : PaperComponent}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
      BackdropProps={{ style: { backgroundColor: tx ? 'rgb(100, 100, 100 , 0.1)' : '' } }}
      disableEscapeKeyDown={loadingTx}
      data-testid="modal"
    >
      <IconButton
        aria-label="close"
        onClick={handleCloseButtonClick}
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
              {translateOperation(operation, { capitalize: true })}
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

export default function ModalWrapper() {
  const { isOpen, args, close } = useModal('operation');
  if (!isOpen) return null;

  return (
    <OperationContextProvider args={args}>
      <OperationsModal isOpen={isOpen} close={close} />;
    </OperationContextProvider>
  );
}

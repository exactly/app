import React, { forwardRef, ReactElement, Ref, useCallback, useMemo, useRef } from 'react';

import {
  Box,
  Dialog,
  DialogContent,
  IconButton,
  useTheme,
  PaperProps,
  Paper,
  useMediaQuery,
  Slide,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import Draggable from 'react-draggable';
import { TransitionProps } from '@mui/material/transitions';
import { useOperationContext } from 'contexts/OperationContext';
import ModalGif from 'components/OperationsModal/ModalGif';
import { Transaction } from 'types/Transaction';
import { track } from 'utils/segment';

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
  tx: Transaction;
};

export default function Loading({ isOpen, tx, close }: Props) {
  const { breakpoints, spacing, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);
  const handleClose = useCallback(() => {
    if (loadingTx) return;
    close();
    track('Modal Closed', {
      name: 'loading',
      location: 'Markets Basic',
    });
  }, [close, loadingTx]);

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
    >
      <IconButton
        aria-label="close"
        onClick={close}
        sx={{
          position: 'absolute',
          right: 4,
          top: 8,
          color: 'grey.500',
        }}
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          borderTop: tx ? '' : `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
        }}
      >
        <DialogContent sx={{ padding: spacing(4, 0, 0, 0) }}>
          <ModalGif tx={tx} />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

import React, { forwardRef, ReactElement, Ref, useMemo, useRef } from 'react';
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
import { TransitionProps } from '@mui/material/transitions';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';

import { DebtManagerContextProvider, useDebtManagerContext } from 'contexts/DebtManagerContext';
import Operation from './Operation';
import { useModal } from 'contexts/ModalContext';

function PaperComponent(props: PaperProps | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper {...props} ref={ref} />
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

function DebtManagerModal({ isOpen, close }: Props) {
  const { tx } = useDebtManagerContext();
  const { t } = useTranslation();
  const { breakpoints, spacing, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);

  return (
    <Dialog
      open={isOpen}
      onClose={loadingTx ? undefined : close}
      PaperComponent={isMobile ? undefined : PaperComponent}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: '400px',
          maxWidth: '488px !important',
          width: '100%',
          overflowY: 'hidden !important',
        },
      }}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
      BackdropProps={{ style: { backgroundColor: tx ? 'rgb(100, 100, 100 , 0.1)' : '' } }}
      disableEscapeKeyDown={loadingTx}
    >
      {!loadingTx && (
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
              mb: { xs: 2, sm: 3 },
              cursor: { xs: '', sm: 'move' },
            }}
          >
            <Typography fontWeight={700} fontSize={24}>
              {t('Debt Rollover')}
            </Typography>
          </DialogTitle>
        )}
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>
          <Operation />
        </DialogContent>
      </Box>
    </Dialog>
  );
}

export default function ModalWrapper() {
  const { isOpen, args, close } = useModal('rollover');
  if (!isOpen) return null;
  return (
    <DebtManagerContextProvider args={args}>
      <DebtManagerModal isOpen={isOpen} close={close} />;
    </DebtManagerContextProvider>
  );
}

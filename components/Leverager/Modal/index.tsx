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
import { TransitionProps } from '@mui/material/transitions';
import Draggable from 'react-draggable';
import { useTranslation } from 'react-i18next';

import { LeveragerContextProvider, useLeveragerContext } from 'contexts/LeveragerContext';
import Operation from '../Operation';
import Summary from '../Summary';
import { useModal } from 'contexts/ModalContext';
import { track } from 'utils/mixpanel';

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

function LeveragerModal({ isOpen, close }: Props) {
  const { input, viewSummary, tx } = useLeveragerContext();
  const { t } = useTranslation();
  const { breakpoints, spacing, palette } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);
  const handleClose = useCallback(() => {
    if (loadingTx) return;
    close();
    track('Modal Closed', {
      name: 'leverager',
    });
  }, [close, loadingTx]);

  return (
    <Dialog
      data-testid="leverage-modal"
      open={isOpen}
      onClose={handleClose}
      PaperComponent={isMobile ? undefined : PaperComponent}
      PaperProps={{
        sx: {
          borderRadius: 1,
          minWidth: '375px',
          maxWidth: '488px !important',
          width: '100%',
          overflowY: 'hidden !important',
        },
      }}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { top: 'auto' } : { backdropFilter: tx ? 'blur(1.5px)' : '' }}
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
        data-testid="leverage-modal-close"
      >
        <CloseIcon sx={{ fontSize: 19 }} />
      </IconButton>
      <Box
        sx={{
          padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
          borderTop: tx ? '' : `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
          overflowY: 'auto',
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
              {viewSummary
                ? input.secondaryOperation === 'deposit'
                  ? t('Leverage')
                  : t('Deleverage')
                : t('Deleverage')}
            </Typography>
            <Typography sx={{ my: 4 }} fontSize={14} fontWeight={400}>
              {t(
                'Remember you have the option to reclaim or supply assets in a single transaction when leveraging or deleveraging a position.',
              )}
            </Typography>
          </DialogTitle>
        )}
        <DialogContent sx={{ p: 0, overflow: 'hidden' }}>{viewSummary ? <Summary /> : <Operation />}</DialogContent>
      </Box>
    </Dialog>
  );
}

export default function ModalWrapper() {
  const { isOpen, close } = useModal('leverager');
  if (!isOpen) return null;
  return (
    <LeveragerContextProvider>
      <LeveragerModal isOpen={isOpen} close={close} />
    </LeveragerContextProvider>
  );
}

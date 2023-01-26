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
  Button,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

import { useModalStatus } from 'contexts/ModalStatusContext';
import OperationContainer from './OperationContainer';
import TypeSwitch from './TypeSwitch';
import Draggable from 'react-draggable';
import { TransitionProps } from '@mui/material/transitions';
import { useOperationContext } from 'contexts/OperationContext';

function PaperComponent(props: PaperProps | undefined) {
  const ref = useRef<HTMLDivElement>(null);
  return (
    <Draggable nodeRef={ref} cancel={'[class*="MuiDialogContent-root"]'}>
      <Paper ref={ref} {...props} />
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
  const theme = useTheme();
  const { open, closeModal, operation } = useModalStatus();
  const { tx } = useOperationContext();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const loadingTx = useMemo(() => tx && (tx.status === 'loading' || tx.status === 'processing'), [tx]);

  return (
    <Dialog
      open={open}
      onClose={loadingTx ? undefined : closeModal}
      PaperComponent={isMobile ? undefined : PaperComponent}
      TransitionComponent={isMobile ? Transition : undefined}
      fullScreen={isMobile}
      sx={isMobile ? { height: 'fit-content', top: 'auto' } : {}}
      disableEscapeKeyDown={loadingTx}
    >
      {(!isMobile || tx) && (
        <IconButton
          aria-label="close"
          onClick={closeModal}
          sx={{
            position: 'absolute',
            right: 4,
            top: 8,
            color: 'grey.500',
          }}
          disabled={loadingTx}
        >
          <CloseIcon sx={{ fontSize: 16 }} />
        </IconButton>
      )}
      <Box sx={{ padding: { xs: '24px 16px 16px', sm: theme.spacing(5, 4, 4) }, borderTop: '4px #000 solid' }}>
        <DialogTitle
          sx={{
            p: 0,
            display: 'flex',
            justifyContent: 'space-between',
            mb: { xs: '24px', sm: 4 },
            cursor: { xs: '', sm: 'move' },
          }}
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
        {isMobile && !tx && (
          <Button fullWidth variant="text" sx={{ color: 'grey.700', mt: '8px' }} onClick={closeModal}>
            Cancel
          </Button>
        )}
      </Box>
    </Dialog>
  );
}

export default OperationsModal;

import React, { forwardRef, type PropsWithChildren } from 'react';
import { Box, IconButton, Typography, useTheme, Slide, SlideProps, Backdrop, BoxProps } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';

type Props = PropsWithChildren<{
  container: SlideProps['container'];
  title?: string;
  open: boolean;
  onClose: () => void;
}> &
  BoxProps;

const ModalSheet = forwardRef(function ModalSheet({ title, container, open, onClose, children, ...props }: Props, ref) {
  const { spacing, palette } = useTheme();

  return (
    <>
      <Slide appear={false} direction="up" in={open} container={container}>
        <Box
          ref={ref}
          sx={{
            borderRadius: 1,
            position: 'absolute',
            left: 0,
            width: '100%',
            height: '600px',
            padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
            borderTop: `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
            backgroundColor: 'components.bg',
            zIndex: 2,
            overflowY: 'hidden',
          }}
          {...props}
        >
          <IconButton
            aria-label="close"
            onClick={onClose}
            sx={{
              position: 'absolute',
              right: 4,
              top: 8,
              color: 'grey.500',
            }}
          >
            <CloseIcon sx={{ fontSize: 19 }} />
          </IconButton>
          <Box sx={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
            {title && (
              <Typography fontWeight={700} fontSize={24}>
                {title}
              </Typography>
            )}
            <Box sx={{ mt: 4, flex: 1, display: 'flex', flexDirection: 'column', overflowY: 'hidden' }}>{children}</Box>
          </Box>
        </Box>
      </Slide>
      <Backdrop open={open} onClick={onClose} />
    </>
  );
});

export default React.memo(ModalSheet);

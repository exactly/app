import React, { ReactNode, type PropsWithChildren } from 'react';
import { Box, Grid, SxProps, Typography, Skeleton } from '@mui/material';
import { type SvgIconComponent } from '@mui/icons-material';
import ArrowForwardRoundedIcon from '@mui/icons-material/ArrowForwardRounded';

export type Variant = 'column' | 'row';

type Props = {
  label: ReactNode;
  icon?: SvgIconComponent;
  variant?: Variant;
};

function ModalInfoColumn({ icon: Icon, label, children }: PropsWithChildren<Omit<Props, 'variant'>>) {
  return (
    <Grid container flexDirection="column">
      {Icon && (
        <Grid item>
          <Icon sx={{ color: 'grey.900', fontSize: 13 }} />
        </Grid>
      )}
      <Grid item>
        <Typography
          component="div"
          fontFamily="fontFamilyMonospaced"
          color="grey.600"
          fontSize={12}
          mb={1}
          fontWeight={500}
          noWrap
        >
          {label}
        </Typography>
      </Grid>
      <Grid item>{children}</Grid>
    </Grid>
  );
}

function ModalInfoRow({ label, children }: PropsWithChildren<Pick<Props, 'label'>>) {
  if (typeof children === 'string') {
    children = <Typography variant="modalRow">{children}</Typography>;
  }

  return (
    <Grid
      container
      flexDirection="row"
      justifyContent="space-between"
      alignItems="center"
      sx={{ px: 1, '&:not(:last-child)': { pb: 1 } }}
    >
      <Grid item>
        <Typography component="div" color="grey.500" fontSize={13} fontWeight={500}>
          {label}
        </Typography>
      </Grid>
      <Grid item>{children}</Grid>
    </Grid>
  );
}

function ModalInfo({ variant = 'column', ...props }: PropsWithChildren<Props>) {
  if (variant === 'column') {
    return <ModalInfoColumn {...props} />;
  }
  return <ModalInfoRow {...props} />;
}

type FromToProps = {
  from?: string;
  to?: string;
  variant?: Variant;
};

export function FromTo({ from, to, variant = 'column' }: FromToProps) {
  const textSx: SxProps = {
    lineHeight: 1,
    textOverflow: 'ellipsis',
    overflow: 'hidden',
  };
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {from ? (
        <Typography variant={variant === 'column' ? 'modalCol' : 'modalRow'} sx={textSx}>
          {from}
        </Typography>
      ) : (
        <Skeleton width={40} />
      )}
      <Box display="flex" alignItems="center">
        <ArrowForwardRoundedIcon sx={{ color: 'blue', fontSize: 13 }} />
      </Box>
      {to ? (
        <Typography variant={variant === 'column' ? 'modalCol' : 'modalRow'} sx={textSx}>
          {to}
        </Typography>
      ) : (
        <Skeleton width={40} />
      )}
    </Box>
  );
}

export default React.memo(ModalInfo);

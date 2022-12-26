import React from 'react';
import { Grid, SxProps, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoRounded';
import WarningIcon from '@mui/icons-material/ErrorRounded';
import ErrorIcon from '@mui/icons-material/ReportProblemRounded';
import SuccessIcon from '@mui/icons-material/CheckCircleRounded';

type Variant = 'info' | 'warning' | 'error' | 'success';

type Props = {
  variant?: Variant;
  message: string;
};

const bg: Record<Variant, string> = {
  info: '#F5FBFF',
  warning: '#FFF5F0',
  error: '#FFF5F5',
  success: '#F5FFF7',
};

const fg: Record<Variant, string> = {
  info: '#1991E6',
  warning: '#EB7E47',
  error: '#EB4747',
  success: '#33994C',
};

const icon: Record<Variant, typeof InfoIcon> = {
  info: InfoIcon,
  warning: WarningIcon,
  error: ErrorIcon,
  success: SuccessIcon,
};

function ModalAlert({ variant = 'info', message }: Props) {
  const gridSx: SxProps = {
    p: 1,
    backgroundColor: bg[variant],
    borderRadius: 1,
    gap: 1,

    '&:not(:last-child)': {
      mb: 1,
    },
  };
  const iconSx: SxProps = {
    fontSize: 14,
    color: fg[variant],
    mt: '2px',
  };
  const textSx: SxProps = {
    fontSize: 14,
    fontWeight: 500,
    color: fg[variant],
  };

  const Icon = icon[variant];

  return (
    <Grid container sx={gridSx} flexDirection="row" alignItems="flex-start">
      <Grid item>
        <Icon sx={iconSx} />
      </Grid>
      <Grid item>
        <Typography sx={textSx}>{message}</Typography>
      </Grid>
    </Grid>
  );
}

export default React.memo(ModalAlert);

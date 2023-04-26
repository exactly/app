import React from 'react';
import { Box, SxProps, Typography } from '@mui/material';
import InfoIcon from '@mui/icons-material/InfoRounded';
import WarningIcon from '@mui/icons-material/ErrorRounded';
import ErrorIcon from '@mui/icons-material/ReportProblemRounded';
import SuccessIcon from '@mui/icons-material/CheckCircleRounded';
import useRouter from 'hooks/useRouter';
import { useMarketContext } from 'contexts/MarketContext';

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

function ModalAlert({ variant = 'error', message }: Props) {
  const { view } = useMarketContext();
  const { pathname: currentPathname } = useRouter();

  const containerSx: SxProps = {
    backgroundColor: bg[variant],
    borderRadius: 1,

    '&:not(:last-child)': {
      mb: 1,
    },
  };
  const iconSx: SxProps = {
    fontSize: 13,
    color: fg[variant],
    mt: '4px',
    ml: 'auto',
  };
  const textSx: SxProps = {
    fontSize: 13,
    fontWeight: 500,
    color: fg[variant],
    mr: 'auto',
    maxWidth: '370px',
  };

  const Icon = icon[variant];

  return (
    <Box sx={containerSx} display="flex" alignItems="flex-center" width="100%" data-testid={`modal-alert-${variant}`}>
      <Box display="flex" gap={0.5} py={1} px={view === 'simple' && currentPathname === '/' ? 2 : 1}>
        <Icon sx={iconSx} />
        <Typography sx={textSx}>{message}</Typography>
      </Box>
    </Box>
  );
}

export default React.memo(ModalAlert);

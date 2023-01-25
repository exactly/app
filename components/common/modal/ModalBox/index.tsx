import React from 'react';
import { Box, BoxProps } from '@mui/material';

export function ModalBox(props: BoxProps) {
  return (
    <Box
      {...props}
      sx={(theme) => ({
        display: 'flex',
        flexDirection: 'column',
        padding: theme.spacing(1, 2, 2, 2),
        borderRadius: 1,
        border: `1px solid ${theme.palette.grey[300]}`,
      })}
    />
  );
}

export function ModalBoxRow(props: BoxProps) {
  return (
    <Box
      {...props}
      sx={(theme) => ({
        display: 'flex',
        flexWrap: 'wrap',
        paddingY: 2,
        minWidth: theme.spacing(20),
        '&:not(:nth-of-type(1))': {
          borderTop: `1px solid ${theme.palette.grey[300]}`,
        },
        '&:nth-of-type(1)': {
          paddingTop: 0,
        },
        '&:last-child': {
          paddingBottom: 0,
        },
      })}
    />
  );
}

export function ModalBoxCell({ divisor = false, ...props }: { divisor?: boolean } & BoxProps) {
  return (
    <Box
      {...props}
      sx={(theme) => ({
        flexGrow: 1,
        flexBasis: '50%',
        minWidth: theme.spacing(8),
        '&:nth-of-type(2n+1)': {
          paddingRight: { xs: 0, sm: 2 },
        },
        '&:nth-of-type(2n)': {
          borderLeft: { xs: 0, sm: divisor ? `1px solid ${theme.palette.grey[300]}` : 'none' },
          paddingLeft: { xs: 0, sm: 2 },
        },
        '&:nth-of-type(n+3)': {
          marginTop: 2,
        },
      })}
    />
  );
}

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
        '&:not(:first-child)': {
          borderTop: `1px solid ${theme.palette.grey[300]}`,
        },
        '&:first-child': {
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
        '&:nth-child(2n+1)': {
          paddingRight: 2,
        },
        '&:nth-child(2n)': {
          borderLeft: divisor ? `1px solid ${theme.palette.grey[300]}` : 'none',
          paddingLeft: 2,
        },
        '&:nth-child(n+3)': {
          marginTop: 2,
        },
      })}
    />
  );
}

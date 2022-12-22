import React, { useMemo } from 'react';
import { Box, Button, useTheme, type ButtonProps } from '@mui/material';
import { useModalStatus } from 'contexts/ModalStatusContext';

type SelectorProps = {
  label: string;
  selected: boolean;
  backgroundColor: string;
} & Omit<ButtonProps, 'backgroundColor'>;

function Selector({ label, backgroundColor, selected, ...props }: SelectorProps) {
  return (
    <Button
      sx={(theme) => ({
        display: 'flex',
        padding: '4px 10px',
        height: 24,
        color: selected ? '#fff' : theme.palette.grey[600],
        textTransform: 'uppercase',
        fontSize: 12,
        fontWeight: 600,
        fontFamily: theme.typography.fontFamilyMonospaced,
        backgroundColor: selected ? backgroundColor : undefined,
        '&:hover': {
          backgroundColor: selected ? backgroundColor : undefined,
        },
      })}
      {...props}
    >
      {label}
    </Button>
  );
}

function TypeSwitch() {
  const theme = useTheme();
  const { operation, toggle } = useModalStatus();

  const options = useMemo<SelectorProps[]>(() => {
    const isFixed = operation?.endsWith('AtMaturity') ?? true;

    return [
      {
        label: 'fixed',
        selected: isFixed,
        backgroundColor: theme.palette.operation.fixed,
        onClick: toggle,
      },
      {
        label: 'variable',
        selected: !isFixed,
        backgroundColor: theme.palette.operation.variable,
        onClick: toggle,
      },
    ];
  }, [operation, theme, toggle]);

  return (
    <Box
      sx={{
        height: 24,
        border: 1,
        borderColor: theme.palette.grey[300],
        borderStyle: 'solid',
        p: 0,
        borderRadius: 16,
        display: 'flex',
        alignItems: 'center',
      }}
    >
      {options.map((o) => (
        <Selector key={o.label} {...o} />
      ))}
    </Box>
  );
}

export default TypeSwitch;

import React, { useMemo } from 'react';
import { Box, Button, useTheme, type ButtonProps } from '@mui/material';
import { useModalStatus } from 'contexts/ModalStatusContext';
import { useOperationContext } from 'contexts/OperationContext';
import { useTranslation } from 'react-i18next';

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
      aria-selected={selected}
      data-testid={`modal-type-switch-${label}`}
      {...props}
    >
      {label}
    </Button>
  );
}

function TypeSwitch() {
  const { t } = useTranslation();
  const theme = useTheme();
  const { operation, toggle } = useModalStatus();
  const { tx } = useOperationContext();

  const options = useMemo<SelectorProps[]>(() => {
    const isFixed = operation?.endsWith('AtMaturity') ?? true;

    return [
      {
        label: t('fixed'),
        selected: isFixed,
        backgroundColor: theme.palette.operation.fixed,
        onClick: toggle,
      },
      {
        label: t('variable'),
        selected: !isFixed,
        backgroundColor: theme.palette.operation.variable,
        onClick: toggle,
      },
    ];
  }, [operation, theme, toggle, t]);

  if (tx) {
    return null;
  }

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        height: 24,
        border: `1px ${theme.palette.grey[300]} solid`,
        borderRadius: 16,
        padding: 0,
        my: 'auto',
      }}
    >
      {options.map((o) => (
        <Selector key={o.label} {...o} />
      ))}
    </Box>
  );
}

export default TypeSwitch;

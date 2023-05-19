import React, { FC, PropsWithChildren } from 'react';
import { Box, Button, ButtonProps, Divider } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const ButtonWithDropdown: FC<ButtonProps & PropsWithChildren> = ({
  children,
  onClick,
  fullWidth,
  variant = 'contained',
}) => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between" width={fullWidth ? '100%' : 'none'}>
      <Button
        variant={variant}
        onClick={onClick}
        fullWidth={fullWidth}
        sx={{
          borderTopRightRadius: 0,
          borderBottomRightRadius: 0,
          height: '32px',
          mr: variant === 'contained' ? 0 : '-0.5px',
        }}
      >
        {children}
      </Button>
      {variant === 'contained' && <Divider orientation="vertical" flexItem sx={{ background: '#484848' }} />}
      <Button
        variant={variant}
        sx={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          minWidth: '28px',
          padding: 0,
          height: '32px',
          ml: variant === 'contained' ? 0 : '-0.5px',
          ...(variant !== 'contained' ? { borderLeftColor: 'transparent' } : {}),
        }}
      >
        <KeyboardArrowDownIcon sx={{ fontSize: 16, padding: 0, margin: 0 }} />
      </Button>
    </Box>
  );
};

export default ButtonWithDropdown;

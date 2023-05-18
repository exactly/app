import React, { FC, PropsWithChildren } from 'react';
import { Box, Button, ButtonProps, Divider } from '@mui/material';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';

const ButtonWithDropdown: FC<ButtonProps & PropsWithChildren> = ({ children, onClick }) => {
  return (
    <Box display="flex" alignItems="center" justifyContent="space-between">
      <Button
        variant="contained"
        onClick={onClick}
        sx={{ borderTopRightRadius: 0, borderBottomRightRadius: 0, height: '32px' }}
      >
        {children}
      </Button>
      <Divider orientation="vertical" flexItem sx={{ background: '#484848' }} />
      <Button
        variant="contained"
        sx={{
          borderTopLeftRadius: 0,
          borderBottomLeftRadius: 0,
          minWidth: '28px',
          padding: 0,
          height: '32px',
        }}
      >
        <KeyboardArrowDownIcon sx={{ fontSize: 16, padding: 0, margin: 0 }} />
      </Button>
    </Box>
  );
};

export default ButtonWithDropdown;

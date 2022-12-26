import React, { PropsWithChildren, ReactNode, useCallback, useState } from 'react';
import { Box, Button, ButtonProps, Menu, MenuItem } from '@mui/material';
import KeyboardArrowDownRoundedIcon from '@mui/icons-material/KeyboardArrowDownRounded';

type Props = {
  label: string;
  options: string[];
  onChange: (value: string) => void;
  renderValue: ReactNode;
  renderOption: (value: string) => ReactNode;
};

function InnerButton({ children }: PropsWithChildren) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
      {children}
      <KeyboardArrowDownRoundedIcon sx={{ width: 16, height: 16, color: 'grey.500' }} />
    </Box>
  );
}

function OptionItem({ onClick, children }: PropsWithChildren<{ onClick: () => void }>) {
  return (
    <MenuItem
      onClick={onClick}
      sx={{
        minWidth: '112px',
        mx: 1,
        mb: '2px',
        px: 0.5,
        py: 0,
        borderRadius: 1,
        '&:hover, &:focus': { backgroundColor: 'grey.200' },
        '&:last-child': { mb: 0 },
      }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>{children}</Box>
    </MenuItem>
  );
}

function DropdownMenu({ label, options, onChange, renderValue, renderOption }: Props) {
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);
  const handleClick = useCallback((event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  }, []);
  const handleClose = useCallback(() => {
    setAnchorEl(null);
  }, []);

  const id = label.replaceAll(' ', '-');

  return (
    <>
      <Button
        id={id}
        aria-label={label}
        aria-controls={open ? `${id}-menu` : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        sx={{ width: 'fit-content', borderRadius: 1, p: 1 }}
      >
        <InnerButton>{renderValue}</InnerButton>
      </Button>
      <Menu
        id={`${id}-menu`}
        aria-labelledby={id}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            boxShadow: '0px 2px 8px rgba(148, 151, 158, 0.2)',
          },
        }}
      >
        {Object.values(options).map((o) => (
          <OptionItem
            key={o}
            onClick={() => {
              onChange(o);
              handleClose();
            }}
          >
            {renderOption(o)}
          </OptionItem>
        ))}
      </Menu>
    </>
  );
}

export default React.memo(DropdownMenu);

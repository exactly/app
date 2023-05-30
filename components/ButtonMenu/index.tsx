import React, { useState, useCallback, useRef } from 'react';
import { Button, ButtonGroup, Menu, MenuItem, Typography } from '@mui/material';
import type { ButtonProps } from '@mui/material';
import MoreHorizIcon from '@mui/icons-material/MoreHoriz';

type ButtonMenuOption = {
  label: string | null;
  disabled?: boolean;
  onClick: () => void;
};

type ButtonMenuProps = {
  id: string;
  options?: ButtonMenuOption[];
  icon?: typeof MoreHorizIcon;
} & ButtonProps;

export default function ButtonMenu({
  id,
  options = [],
  icon: Icon = MoreHorizIcon,
  variant,
  ...props
}: ButtonMenuProps) {
  const anchorRef = useRef<HTMLDivElement>(null);
  const [open, setOpen] = useState(false);

  const handleClick = useCallback(() => setOpen(true), []);
  const handleClose = useCallback(() => setOpen(false), []);

  return (
    <>
      <ButtonGroup variant={variant} ref={anchorRef}>
        <Button
          variant={variant}
          {...props}
          sx={[
            {
              '&:hover': { zIndex: 1 },
            },
            ...(Array.isArray(props.sx) ? props.sx.flat() : [props.sx]),
          ]}
        />
        <Button
          aria-controls={open ? `${id}-menu` : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-label="More options"
          aria-haspopup="menu"
          variant={variant}
          sx={{ backgroundColor: 'components.bg', minWidth: 'fit-content', p: 0.5 }}
          onClick={handleClick}
        >
          <Icon />
        </Button>
      </ButtonGroup>
      <Menu
        id={`${id}-menu`}
        anchorEl={anchorRef.current}
        open={open}
        onClose={handleClose}
        anchorOrigin={{
          vertical: anchorRef.current?.clientHeight ? anchorRef.current.clientHeight + 4 : 'bottom',
          horizontal: 'left',
        }}
        sx={{
          '& .MuiPaper-root': {
            minWidth: anchorRef.current?.clientWidth,
            boxShadow: '0px 2px 8px rgba(148, 151, 158, 0.2)',
            borderRadius: 2,
          },
        }}
      >
        {options.map((o) => (
          <MenuItem
            key={String(o.label)}
            onClick={() => {
              o.onClick();
              handleClose();
            }}
            disabled={o.disabled}
            sx={{
              minHeight: '32px',
              mx: 1,
              mb: '2px',
              px: 1,
              py: 0.5,
              borderRadius: 1,
              '&:hover': { backgroundColor: 'grey.200' },
              '&:last-child': { mb: 0 },
            }}
          >
            <Typography width="100%" fontWeight={600} textAlign="right" fontSize={13}>
              {o.label}
            </Typography>
          </MenuItem>
        ))}
      </Menu>
    </>
  );
}

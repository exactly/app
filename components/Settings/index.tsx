import { IconButton, Menu, MenuItem } from '@mui/material';
import React from 'react';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import AdvancedViewSwitch from 'components/AdvancedSwitch';

const Settings = () => {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const open = Boolean(anchorEl);
  const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const handleClose = () => setAnchorEl(null);

  return (
    <>
      <IconButton
        id="view-contracts-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        onClick={handleClick}
        size="small"
        sx={{ outline: '1px solid', width: '32px', height: '32px', borderRadius: '50%', p: '0px' }}
        // variant="outlined"
      >
        <SettingsRoundedIcon sx={{ fontSize: 20 }} />
      </IconButton>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        MenuListProps={{
          'aria-labelledby': 'view-contracts-button',
        }}
        slotProps={{
          paper: {
            sx: {
              marginTop: 1,
              padding: ({ spacing }) => spacing(0.5, 1, 0.5, 1),
              boxShadow: ({ palette: _palette }) =>
                _palette.mode === 'light' ? '0px 4px 12px rgba(175, 177, 182, 0.2)' : '',
              borderRadius: '16px',
            },
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <MenuItem sx={{ borderRadius: '8px' }}>
          <AdvancedViewSwitch />
        </MenuItem>
      </Menu>
    </>
  );
};

export default Settings;

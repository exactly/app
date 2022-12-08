import React, { useMemo } from 'react';
import { useEnsName, useConnect, useDisconnect } from 'wagmi';
import { useWeb3 } from 'hooks/useWeb3';
import { formatWallet } from 'utils/utils';

import { Avatar, Box, Button, capitalize, Divider, Menu, MenuItem, Typography } from '@mui/material';

import * as blockies from 'blockies-ts';

function Wallet() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const { walletAddress } = useWeb3();
  const { chain } = useWeb3();
  const { data: ens } = useEnsName({ address: walletAddress as `0x${string}` });
  const { connect } = useConnect();
  const { disconnect } = useDisconnect();

  const formattedWallet = formatWallet(walletAddress);

  const avatarImgSrc = useMemo(() => {
    if (!walletAddress) return '';
    return blockies.create({ seed: walletAddress.toLocaleLowerCase() }).toDataURL();
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <Button onClick={() => connect()} variant="contained">
        Connect wallet
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={openMenu}
        id="basic-button"
        aria-controls={open ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        sx={{ borderColor: '#E3E5E8', px: '10px' }}
      >
        <Avatar alt="Blocky Avatar" src={avatarImgSrc} sx={{ width: 20, height: 20, mr: '10px' }} />
        <Typography variant="subtitle1" color="#0D0E0F">
          {ens ?? formattedWallet}
        </Typography>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          style: {
            padding: '0 4px 4px 4px',
            boxShadow: '#A7A7A7 0px 0px 2px 0px',
            borderRadius: '2px',
            minWidth: '150px',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'center',
        }}
      >
        <MenuItem>
          <Box>
            <Typography variant="subtitle1">Network</Typography>
            <Box>{capitalize((chain?.network === 'homestead' ? 'mainnet' : chain?.network) || '')}</Box>
          </Box>
        </MenuItem>
        <Divider />
        <MenuItem
          onClick={() => {
            closeMenu();
            disconnect();
          }}
        >
          Disconnect wallet
        </MenuItem>
      </Menu>
    </>
  );
}

export default Wallet;

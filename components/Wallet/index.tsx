import React, { useMemo } from 'react';
import { useDisconnect, useEnsName } from 'wagmi';
import { useWeb3 } from 'hooks/useWeb3';
import { formatWallet } from 'utils/utils';

import { Avatar, Box, Button, Menu, Typography } from '@mui/material';

import * as blockies from 'blockies-ts';
import CopyToClipboardButton from 'components/common/CopyToClipboardButton';
import { useWeb3Modal } from '@web3modal/react';

function Wallet() {
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const { walletAddress } = useWeb3();
  const { disconnect } = useDisconnect();
  const { data: ens } = useEnsName({ address: walletAddress as `0x${string}` });
  const { open } = useWeb3Modal();

  const formattedWallet = formatWallet(walletAddress);

  const avatarImgSrc = useMemo(() => {
    if (!walletAddress) return '';
    return blockies.create({ seed: walletAddress.toLocaleLowerCase() }).toDataURL();
  }, [walletAddress]);

  if (!walletAddress) {
    return (
      <Button onClick={() => open({ route: 'ConnectWallet' })} variant="contained">
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
        aria-controls={isMenuOpen ? 'basic-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isMenuOpen ? 'true' : undefined}
        sx={{
          py: 1,
          px: '10px',
          borderColor: '#CFD3D8',
          '&:hover': {
            backgroundColor: '#fff',
            borderColor: '#EDEFF2',
            boxShadow: '0px 3px 4px rgba(97, 102, 107, 0.1)',
          },
        }}
      >
        <Avatar alt="Blocky Avatar" src={avatarImgSrc} sx={{ width: 20, height: 20, mr: '5px' }} />
        <Typography variant="subtitle1" color="#0D0E0F">
          {ens ?? formattedWallet}
        </Typography>
      </Button>
      <Menu
        id="basic-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          style: {
            marginTop: '8px',
            padding: '16px',
            boxShadow: '0px 4px 12px rgba(97, 100, 107, 0.2)',
            borderRadius: '6px',
            minWidth: '280px',
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
        <Box display="flex" flexDirection="column" gap={1}>
          <Avatar alt="Blocky Avatar" src={avatarImgSrc} sx={{ mx: 'auto', width: 40, height: 40 }} />
          <Box display="flex" flexDirection="column" my={1} mx="auto" textAlign="center">
            {ens && (
              <Typography variant="h6" lineHeight="16px">
                {ens}
              </Typography>
            )}
            <Box display="flex">
              <Typography variant="subtitle1" fontSize="16px" color="grey.500">
                {formattedWallet}
              </Typography>
              <CopyToClipboardButton text={walletAddress} />
            </Box>
          </Box>
          <Button
            variant="outlined"
            onClick={() => {
              closeMenu();
              disconnect();
            }}
          >
            Disconnect
          </Button>
        </Box>
      </Menu>
    </>
  );
}

export default Wallet;

import React, { useCallback, useMemo } from 'react';
import { useConnect, useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useWeb3 } from 'hooks/useWeb3';
import { formatWallet } from 'utils/utils';

import { Avatar, Box, Button, Menu, Typography } from '@mui/material';

import * as blockies from 'blockies-ts';
import CopyToClipboardButton from 'components/common/CopyToClipboardButton';
import { useWeb3Modal } from '@web3modal/react';
import { globals } from 'styles/theme';

const { onlyDesktop } = globals;

function Wallet() {
  const { connectors, connect } = useConnect();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const openMenu = (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget);
  const closeMenu = () => setAnchorEl(null);

  const { walletAddress } = useWeb3();
  const { disconnect } = useDisconnect();
  const { data: ens, error: ensError } = useEnsName({ address: walletAddress as `0x${string}`, chainId: mainnet.id });
  const { data: ensAvatar, error: ensAvatarError } = useEnsAvatar({
    address: walletAddress as `0x${string}`,
    chainId: mainnet.id,
  });
  const { open } = useWeb3Modal();

  const formattedWallet = formatWallet(walletAddress);

  const walletConnect = useCallback(() => {
    if (JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false')) {
      const injected = connectors.find(({ id, ready, name }) => ready && id === 'injected' && name === 'E2E');
      connect({ connector: injected });
    } else {
      open({ route: 'ConnectWallet' });
    }
  }, [connectors, connect, open]);

  const avatarImgSrc = useMemo(() => {
    if (!walletAddress) return '';
    if (ensAvatar && !ensAvatarError) return ensAvatar;
    return blockies.create({ seed: walletAddress.toLocaleLowerCase() }).toDataURL();
  }, [walletAddress, ensAvatar, ensAvatarError]);

  if (!walletAddress) {
    return (
      <Button
        onClick={walletConnect}
        variant="contained"
        sx={{ fontSize: { xs: 10, sm: 13 } }}
        data-testid="connect-wallet"
      >
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
          minWidth: '30px',
          py: 1,
          px: '10px',
          borderColor: '#CFD3D8',
          '&:hover': {
            backgroundColor: 'components.bg',
            borderColor: 'figma.grey.100',
            boxShadow: '0px 3px 4px rgba(97, 102, 107, 0.1)',
          },
        }}
        data-testid="wallet-menu"
      >
        <Avatar alt="Address avatar" src={avatarImgSrc} sx={{ width: 20, height: 20, mr: { xs: 0, sm: '5px' } }} />
        <Typography variant="subtitle1" color="grey.900" display={onlyDesktop} data-testid="user-address">
          {ens && !ensError ? ens : formattedWallet}
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
            borderRadius: 16,
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
            {ens && !ensError && (
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
            data-testid="wallet-menu-disconnect"
            variant="outlined"
            onClick={() => {
              closeMenu();
              disconnect();
            }}
            sx={{ color: 'grey.700', borderColor: '#CFD3D8' }}
          >
            Disconnect
          </Button>
        </Box>
      </Menu>
    </>
  );
}

export default Wallet;

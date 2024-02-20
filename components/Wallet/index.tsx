import React, { useCallback, useMemo } from 'react';
import { useDisconnect, useEnsAvatar, useEnsName } from 'wagmi';
import { mainnet } from 'wagmi/chains';
import { useWeb3 } from 'hooks/useWeb3';
import { formatWallet } from 'utils/utils';
import SettingsIcon from '@mui/icons-material/Settings';
import PowerSettingsNewIcon from '@mui/icons-material/PowerSettingsNew';
import Image from 'next/image';

import { Avatar, Box, Button, List, ListItem, ListItemButton, Menu, Typography } from '@mui/material';
import { Visibility } from '@mui/icons-material';
import * as blockies from 'blockies-ts';
import CopyToClipboardButton from 'components/common/CopyToClipboardButton';
import { globals } from 'styles/theme';
import { useTranslation } from 'react-i18next';
import Link from 'next/link';
import useRouter from 'hooks/useRouter';
import { track } from 'utils/mixpanel';

const { onlyDesktop } = globals;

function Wallet() {
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
  const isMenuOpen = Boolean(anchorEl);

  const openMenu = useCallback((event: React.MouseEvent<HTMLButtonElement>) => {
    setAnchorEl(event.currentTarget);
    track('Button Clicked', {
      location: 'Navbar',
      name: 'wallet',
    });
  }, []);
  const closeMenu = () => setAnchorEl(null);

  const { walletAddress, connect, impersonateActive, exitImpersonate, chain } = useWeb3();
  const { disconnect } = useDisconnect();
  const { data: ens, error: ensError } = useEnsName({ address: walletAddress, chainId: mainnet.id });
  const { data: ensAvatar, error: ensAvatarError } = useEnsAvatar({
    name: ens,
    chainId: mainnet.id,
  });
  const { query } = useRouter();

  const formattedWallet = formatWallet(walletAddress);
  const network = chain?.name;

  const avatarImgSrc = useMemo(() => {
    if (!walletAddress) return '';
    if (ensAvatar && !ensAvatarError) return ensAvatar;
    return blockies.create({ seed: walletAddress.toLocaleLowerCase() }).toDataURL();
  }, [ensAvatar, ensAvatarError, walletAddress]);

  const handleConnectButtonClick = useCallback(() => {
    track('Button Clicked', {
      location: 'Navbar',
      name: 'connect wallet',
      chainId: chain?.id,
      impersonateActive,
    });
    connect();
  }, [chain?.id, connect, impersonateActive]);

  const handleDisconnectClick = useCallback(() => {
    closeMenu();
    impersonateActive ? exitImpersonate() : disconnect();
    track('Button Clicked', {
      name: 'disconnect wallet',
      location: 'Wallet',
      chainId: chain?.id,
      impersonateActive,
    });
  }, [chain, disconnect, exitImpersonate, impersonateActive]);

  if (!walletAddress) {
    return (
      <Button
        onClick={handleConnectButtonClick}
        variant="contained"
        sx={{ fontSize: { xs: 10, sm: 13 } }}
        data-testid="connect-wallet"
      >
        {t('Connect wallet')}
        <Image
          src={`/img/networks/${chain?.id}.svg`}
          alt=""
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
            marginLeft: '5px',
          }}
        />
      </Button>
    );
  }

  return (
    <>
      <Button
        variant="outlined"
        onClick={openMenu}
        id="wallet-button"
        aria-controls={isMenuOpen ? 'wallet-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={isMenuOpen ? 'true' : undefined}
        sx={{
          minWidth: '30px',
          py: 1,
          px: '10px',
        }}
        data-testid="wallet-menu"
      >
        <Image
          src={`/img/networks/${chain?.id}.svg`}
          alt=""
          width={20}
          height={20}
          style={{
            maxWidth: '100%',
            height: 'auto',
            marginRight: '5px',
          }}
        />
        <Avatar alt="Address avatar" src={avatarImgSrc} sx={{ width: 20, height: 20, mr: '5px' }} />
        <Box display="flex" gap={1} flexDirection="row">
          <Typography variant="subtitle1" color="grey.900" display={onlyDesktop} data-testid="user-address">
            {ens && !ensError ? ens : formattedWallet}
          </Typography>
          {impersonateActive && <Visibility />}
        </Box>
      </Button>
      <Menu
        id="wallet-menu"
        anchorEl={anchorEl}
        open={isMenuOpen}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'wallet-button',
        }}
        slotProps={{
          paper: {
            sx: {
              marginTop: 1,
              boxShadow: ({ palette }) => (palette.mode === 'light' ? '0px 4px 12px rgba(97, 100, 107, 0.2)' : ''),
              borderRadius: '16px',
              minWidth: '216px',
              maxWidth: '320px',
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
        <Box display="flex" flexDirection="column" gap={1} paddingTop={2}>
          <Avatar alt="Blocky Avatar" src={avatarImgSrc} sx={{ mx: 'auto', width: 40, height: 40 }} />
          <Box display="flex" flexDirection="column" my={1} mx="auto" textAlign="center" gap={2} alignItems="center">
            {ens && !ensError && (
              <Typography variant="h6" lineHeight="16px">
                {ens}
              </Typography>
            )}
            <Box display="flex" alignSelf={'center'}>
              <Typography variant="subtitle1" fontSize="16px" color="grey.500">
                {formattedWallet}
              </Typography>
              <CopyToClipboardButton text={walletAddress} sx={{ width: 16, height: 16 }} />
            </Box>
            <Box display="flex" gap={0.5}>
              <Image
                src={`/img/networks/${chain?.id}.svg`}
                alt=""
                width={20}
                height={20}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
              <Typography fontSize="14px" fontWeight={500} color="grey.500">
                {t('{{network}} Address', { network })}
              </Typography>
            </Box>
            {impersonateActive && (
              <Box
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  backgroundColor: 'figma.grey.100',
                  padding: 0.5,
                  gap: 1,
                  borderRadius: 1,
                }}
              >
                <Visibility fontSize={'small'} />
                <Typography fontSize={12} fontWeight={500}>
                  {t('Read-only mode')}
                </Typography>
              </Box>
            )}
          </Box>
          <List disablePadding sx={{ borderTop: 1, borderColor: 'grey.300', pt: 1, px: 1 }}>
            {!impersonateActive && (
              <Link
                href={{ pathname: 'revoke', query }}
                legacyBehavior
                onClick={() =>
                  track('Button Clicked', {
                    href: '/revoke',
                    location: 'Wallet',
                    name: 'manage allowances',
                  })
                }
              >
                <ListItem disablePadding>
                  <ListItemButton sx={{ borderRadius: 1, p: 1 }}>
                    <SettingsIcon sx={{ width: '16px', height: '16px' }} />
                    <Typography fontSize={14} fontWeight={700} marginLeft={0.5}>
                      {t('Manage Allowances')}
                    </Typography>
                  </ListItemButton>
                </ListItem>
              </Link>
            )}
            <ListItem disablePadding>
              <ListItemButton sx={{ borderRadius: 1, p: 1 }} onClick={handleDisconnectClick}>
                <PowerSettingsNewIcon sx={{ width: '16px', height: '16px' }} />
                <Typography fontSize={14} fontWeight={700} marginLeft={0.5}>
                  {impersonateActive ? t('Exit Read-Only Mode') : t('Disconnect')}
                </Typography>
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Menu>
    </>
  );
}

export default Wallet;

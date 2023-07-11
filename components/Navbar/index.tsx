import React, { ReactNode, useCallback, useEffect, useState } from 'react';
import { setContext, setUser } from '@sentry/nextjs';
import { useBlockNumber, useConfig } from 'wagmi';
import { optimism, goerli } from 'wagmi/chains';
import Image from 'next/image';
import useRouter from 'hooks/useRouter';

import { useWeb3 } from 'hooks/useWeb3';

import {
  AppBar,
  Dialog,
  DialogContent,
  DialogTitle,
  Box,
  Button,
  Chip,
  IconButton,
  Toolbar,
  useTheme,
  Typography,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';

import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { globals } from 'styles/theme';
import MobileMenu from 'components/MobileMenu';
import Link from 'next/link';
import Wallet from 'components/Wallet';
import SelectMarketsView from 'components/SelectMarketsView';
import { useMarketContext } from 'contexts/MarketContext';
import ClaimRewards from 'components/ClaimRewards';
import { useTranslation } from 'react-i18next';
import MaturityDateReminder from 'components/MaturityDateReminder';
import Faucet from 'components/operations/Faucet';
import SecondaryChain from 'components/SecondaryChain';

const { onlyMobile, onlyDesktopFlex } = globals;

function Navbar() {
  const { t } = useTranslation();
  const { connector } = useConfig();
  const { walletAddress } = useWeb3();
  const { pathname: currentPathname, query } = useRouter();
  const { chain, isConnected } = useWeb3();

  const { palette, spacing } = useTheme();
  const { view } = useMarketContext();
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [openFaucet, setOpenFaucet] = useState(false);

  const { data: blockNumber } = useBlockNumber({ chainId: chain?.id });

  useEffect(() => {
    if (!walletAddress) return;

    setUser({ id: walletAddress });
    setContext('wallet', { connector: connector?.id, name: connector?.name });
    setContext('chain', {
      id: chain?.id,
      name: chain?.name,
      network: chain?.network,
      blockNumber,
      testnet: chain?.testnet,
    });
  }, [walletAddress, connector, chain, blockNumber]);

  const onClose = useCallback(() => setOpenFaucet(false), []);

  const handleFaucetClick = useCallback(() => {
    if (chain?.id === goerli.id) return setOpenFaucet(true);
  }, [chain?.id]);

  const setBodyColor = (color: string) => {
    document.body.style.backgroundColor = color;
  };

  useEffect(() => {
    view === 'simple' && currentPathname === '/'
      ? setBodyColor(palette.markets.simple)
      : setBodyColor(palette.markets.advanced);
  }, [currentPathname, view, palette.markets.advanced, palette.markets.simple]);

  const routes: {
    pathname: string;
    name: string;
    custom?: ReactNode;
    icon?: ReactNode;
  }[] = [
    { pathname: '/', name: t('Markets'), custom: <SelectMarketsView /> },
    {
      pathname: '/dashboard',
      name: t('Dashboard'),
      icon: <AccountBalanceWalletIcon sx={{ fontSize: '13px' }} />,
    },
  ];

  const isOPMainnet = chain?.id === optimism.id;

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <MaturityDateReminder />
      <AppBar
        position="static"
        color="transparent"
        sx={{ height: '56px', mb: { xs: 0, sm: 2.5 } }}
        data-testid="navbar"
      >
        <Toolbar disableGutters sx={{ padding: '0 0', gap: '8px' }}>
          <Link href={{ pathname: '/', query }}>
            <Box display="flex" alignItems="center">
              <Image
                src={palette.mode === 'light' ? '/img/logo.svg' : '/img/logo-white.png'}
                alt="Exactly Logo"
                width={103}
                height={30}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Box>
          </Link>
          <Box display="flex" gap={0.2}>
            {routes.map(({ name, pathname, custom, icon }) => (
              <Box key={pathname} display={onlyDesktopFlex}>
                {custom || (
                  <Link href={{ pathname, query }}>
                    <Button
                      sx={{
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: '13px',
                        fontWeight: 700,
                        gap: 0.5,
                      }}
                      variant={pathname === currentPathname ? 'contained' : 'text'}
                      data-testid={`navbar-link-${name.toLowerCase()}`}
                    >
                      {icon}
                      <Typography fontWeight={700} fontSize={13}>
                        {name}
                      </Typography>
                    </Button>
                  </Link>
                )}
              </Box>
            ))}
          </Box>
          <Box display="flex" gap={0.5} ml="auto" flexDirection={{ xs: 'row-reverse', sm: 'row' }}>
            {isConnected && chain?.id === goerli.id && (
              <Chip label="Goerli Faucet" onClick={handleFaucetClick} sx={{ my: 'auto', display: onlyDesktopFlex }} />
            )}
            {isOPMainnet && (
              <Link href={'/bridge'}>
                <Button variant="contained" sx={{ minWidth: '125px' }}>
                  {t('Bridge & Swap')}
                </Button>
              </Link>
            )}
            <Box display="flex" gap={0.5}>
              <SecondaryChain />
              <ClaimRewards />
              <Wallet />
            </Box>
          </Box>
          <IconButton
            size="small"
            edge="start"
            aria-label="menu"
            sx={{ display: onlyMobile }}
            onClick={() => setOpenMenu(true)}
          >
            <MenuIcon sx={{ color: 'figma.grey.300' }} />
          </IconButton>
        </Toolbar>
        <Box display={onlyMobile}>
          <MobileMenu open={openMenu} handleClose={() => setOpenMenu(false)} />
        </Box>
      </AppBar>

      <Dialog open={openFaucet} onClose={onClose}>
        <IconButton
          aria-label="close"
          onClick={onClose}
          sx={{
            position: 'absolute',
            right: 4,
            top: 8,
            color: 'grey.500',
          }}
          data-testid="modal-close"
        >
          <CloseIcon sx={{ fontSize: 19 }} />
        </IconButton>
        <Box
          sx={{
            padding: { xs: spacing(3, 2, 2), sm: spacing(5, 4, 4) },
            borderTop: `4px ${palette.mode === 'light' ? 'black' : 'white'} solid`,
          }}
        >
          <DialogTitle
            sx={{
              p: 0,
              mb: { xs: 2, sm: 3 },
            }}
          >
            <Typography fontWeight={700} fontSize={24} data-testid="modal-title">
              {t('Faucet')}
            </Typography>
          </DialogTitle>
          <DialogContent sx={{ padding: spacing(4, 0, 0, 0) }}>
            <Faucet />
          </DialogContent>
        </Box>
      </Dialog>
    </Box>
  );
}

export default Navbar;

import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
import { setContext, setUser } from '@sentry/nextjs';
import { mainnet, useConfig } from 'wagmi';
import { goerli } from 'wagmi/chains';
import Image from 'next/image';
import useRouter from 'hooks/useRouter';

import { useWeb3 } from 'hooks/useWeb3';

import { AppBar, Box, Button, Chip, IconButton, Toolbar, useTheme, Typography, useMediaQuery } from '@mui/material';

import MovingSharpIcon from '@mui/icons-material/MovingSharp';
import RemoveCircleOutlineRoundedIcon from '@mui/icons-material/RemoveCircleOutlineRounded';
import MonitorHeartRoundedIcon from '@mui/icons-material/MonitorHeartRounded';
import GppGoodRoundedIcon from '@mui/icons-material/GppGoodRounded';

import MenuIcon from '@mui/icons-material/Menu';
import GavelIcon from '@mui/icons-material/Gavel';
import SwapHorizIcon from '@mui/icons-material/SwapHoriz';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { globals } from 'styles/theme';
import MobileMenu from 'components/MobileMenu';
import Link from 'next/link';
import Wallet from 'components/Wallet';
import SelectMarketsView from 'components/SelectMarketsView';
import { useTranslation } from 'react-i18next';
import { RewardsButton } from 'components/RewardsModal';
import { useCustomTheme } from 'contexts/ThemeContext';
import { useModal } from 'contexts/ModalContext';
import CustomMenu from './CustomMenu';
import Settings from 'components/Settings';
import { identify, track } from '../../utils/segment';
import useReadOnly from 'hooks/useReadOnly';
import { AccountInput } from 'components/AccountInput';

const { onlyMobile, onlyDesktopFlex } = globals;

function Navbar() {
  const { t } = useTranslation();
  const { connector } = useConfig();
  const { walletAddress } = useWeb3();
  const { pathname: currentPathname, query } = useRouter();
  const { chain, isConnected, impersonateActive } = useWeb3();
  const { isReadOnly } = useReadOnly();

  const { palette, breakpoints } = useTheme();
  const { view } = useCustomTheme();
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  useEffect(() => {
    if (!walletAddress) return;
    identify(walletAddress);
    track('Wallet Connected', {
      connectorId: connector?.id,
      connectorName: connector?.name,
    });
  }, [connector?.id, connector?.name, walletAddress]);

  useEffect(() => {
    if (!walletAddress) return;

    setUser({ id: walletAddress });
    setContext('wallet', { connector: connector?.id, name: connector?.name });
    setContext('chain', {
      id: chain?.id,
      name: chain?.name,
      network: chain?.network,
      testnet: chain?.testnet,
    });
  }, [walletAddress, connector, chain]);

  const setBodyColor = (color: string) => {
    document.body.style.backgroundColor = color;
  };

  useEffect(() => {
    view === 'simple' && currentPathname === '/'
      ? setBodyColor(palette.markets.simple)
      : setBodyColor(palette.markets.advanced);
  }, [currentPathname, view, palette.markets.advanced, palette.markets.simple]);

  const isEthereum = chain.id === mainnet.id;

  const routes: {
    pathname: string | null;
    name: string;
    custom?: ReactNode;
    icon?: ReactNode;
    isNew?: boolean;
  }[] = useMemo(
    () => [
      { pathname: '/', name: t('Markets'), custom: <SelectMarketsView /> },
      {
        pathname: '/dashboard',
        name: t('Dashboard'),
        icon: <AccountBalanceWalletIcon sx={{ fontSize: 14 }} />,
      },
      {
        pathname: '/strategies',
        name: t('Strategies'),
        icon: <MovingSharpIcon sx={{ fontSize: '13px' }} />,
      },
      ...(!isEthereum
        ? [
            {
              pathname: '/governance',
              name: t('Governance'),
              icon: <GavelIcon sx={{ fontSize: '13px' }} />,
            },
          ]
        : []),
      {
        pathname: null,
        name: t('Security'),
        custom: (
          <CustomMenu
            name={t('Security')}
            icon={<GppGoodRoundedIcon sx={{ fontSize: 16 }} />}
            options={[
              {
                pathname: '/security',
                name: t('Security Hub'),
                icon: <GppGoodRoundedIcon sx={{ fontSize: '13px' }} />,
                isNew: false,
              },
              {
                pathname: '/activity',
                name: t('Activity Monitor'),
                icon: <MonitorHeartRoundedIcon sx={{ fontSize: '13px' }} />,
                isNew: false,
              },
              {
                pathname: '/revoke',
                name: t('Revoke Allowances'),
                icon: <RemoveCircleOutlineRoundedIcon sx={{ fontSize: '13px' }} />,
                isNew: false,
              },
            ]}
          />
        ),
      },
      {
        pathname: '/bridge',
        name: t('Bridge & Swap'),
        icon: <SwapHorizIcon sx={{ fontSize: '13px' }} />,
      },
    ],
    [isEthereum, t],
  );

  const { open: openFaucet } = useModal('faucet');

  const handleMenuIconClick = useCallback(() => {
    setOpenMenu(true);
    track('Button Clicked', {
      location: 'Navbar',
      icon: 'Menu',
      name: 'mobile menu',
    });
  }, []);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <AppBar
        position="static"
        color="transparent"
        sx={{ height: '56px', mb: { xs: 0, sm: 2.5 } }}
        data-testid="navbar"
      >
        <Toolbar disableGutters sx={{ padding: '0 0', gap: '8px' }}>
          <Link href={{ pathname: '/', query }}>
            <Box display="flex" alignItems="center" mr={2}>
              <Image
                src={palette.mode === 'light' ? '/img/logo-black.svg' : '/img/logo-white.svg'}
                alt="Exactly Protocol Logo"
                width={30}
                height={30}
                style={{
                  maxWidth: '100%',
                  height: 'auto',
                }}
              />
            </Box>
          </Link>
          <Box display="flex" gap={0.5}>
            {routes.map(({ name, pathname, custom, icon, isNew }) => (
              <Box key={pathname} display={onlyDesktopFlex}>
                {custom || (
                  <Link href={{ pathname, query }}>
                    <Button
                      sx={{
                        px: 1.5,
                        display: 'flex',
                        alignItems: 'center',
                        fontSize: 14,
                        fontWeight: 700,
                        gap: 0.5,
                      }}
                      variant={pathname === currentPathname ? 'contained' : 'text'}
                      data-testid={`navbar-link-${name.toLowerCase()}`}
                    >
                      {icon}
                      <Typography fontWeight={700} fontSize={14}>
                        {name}
                      </Typography>
                      {isNew && (
                        <Typography
                          fontSize={11}
                          fontWeight={700}
                          color="white"
                          sx={{ background: palette.green, borderRadius: '4px', px: 0.5, textTransform: 'uppercase' }}
                        >
                          {t('New')}
                        </Typography>
                      )}
                    </Button>
                  </Link>
                )}
              </Box>
            ))}
          </Box>
          <Box display="flex" gap={0.5} ml="auto" flexDirection={{ xs: 'row-reverse', sm: 'row' }}>
            {isConnected && chain?.id === goerli.id && (
              <Chip label="Goerli Faucet" onClick={openFaucet} sx={{ my: 'auto', display: onlyDesktopFlex }} />
            )}
            <Box display="flex" gap={0.5}>
              {!isMobile && !isEthereum && <RewardsButton />}
              {isReadOnly && !impersonateActive ? <AccountInput /> : <Wallet />}
              {!isMobile && <Settings />}
            </Box>
          </Box>
          <IconButton
            size="small"
            edge="start"
            aria-label="menu"
            sx={{ display: onlyMobile }}
            onClick={handleMenuIconClick}
          >
            <MenuIcon sx={{ color: 'figma.grey.300' }} />
          </IconButton>
        </Toolbar>
        <Box display={onlyMobile}>
          <MobileMenu open={openMenu} handleClose={() => setOpenMenu(false)} />
        </Box>
      </AppBar>
    </Box>
  );
}

export default Navbar;

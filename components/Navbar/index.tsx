import React, { ReactNode, useEffect, useMemo, useState } from 'react';
import { setContext, setUser } from '@sentry/nextjs';
import { mainnet, useConfig } from 'wagmi';
import { optimism, goerli } from 'wagmi/chains';
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
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import { globals } from 'styles/theme';
import MobileMenu from 'components/MobileMenu';
import Link from 'next/link';
import Wallet from 'components/Wallet';
import SelectMarketsView from 'components/SelectMarketsView';
import { useTranslation } from 'react-i18next';
import MaturityDateReminder from 'components/MaturityDateReminder';
import SecondaryChain from 'components/SecondaryChain';
import { RewardsButton } from 'components/RewardsModal';
import Velodrome from 'components/Velodrome';
import { useCustomTheme } from 'contexts/ThemeContext';
import { useModal } from 'contexts/ModalContext';
import MoreMenu from './MoreMenu';

const { onlyMobile, onlyDesktopFlex } = globals;

function Navbar() {
  const { t } = useTranslation();
  const { connector } = useConfig();
  const { walletAddress } = useWeb3();
  const { pathname: currentPathname, query } = useRouter();
  const { chain, isConnected } = useWeb3();

  const { palette, breakpoints } = useTheme();
  const { view } = useCustomTheme();
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const isMobile = useMediaQuery(breakpoints.down('sm'));

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

  const isOPMainnet = chain.id === optimism.id;
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
      {
        pathname: null,
        name: t('More'),
        custom: (
          <MoreMenu
            options={[
              ...(!isEthereum
                ? [
                    {
                      pathname: '/governance',
                      name: t('Governance'),
                      icon: <GavelIcon sx={{ fontSize: '13px' }} />,
                    },
                  ]
                : []),

              ...(isOPMainnet
                ? [
                    {
                      pathname: '/bridge',
                      name: t('Bridge & Swap'),
                      icon: <RepeatRoundedIcon sx={{ fontSize: '13px' }} />,
                    },
                  ]
                : []),
              {
                pathname: '/security',
                name: t('Security Hub'),
                icon: <GppGoodRoundedIcon sx={{ fontSize: '13px' }} />,
                isNew: true,
              },
              {
                pathname: '/activity',
                name: t('Activity Monitor'),
                icon: <MonitorHeartRoundedIcon sx={{ fontSize: '13px' }} />,
                isNew: true,
              },
              {
                pathname: '/revoke',
                name: t('Revoke Allowances'),
                icon: <RemoveCircleOutlineRoundedIcon sx={{ fontSize: '13px' }} />,
                isNew: true,
              },
            ]}
          />
        ),
      },
    ],
    [isEthereum, isOPMainnet, t],
  );

  const { open: openFaucet } = useModal('faucet');

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
              {!isMobile && <SecondaryChain />}
              {isOPMainnet && <Velodrome />}
              {!isMobile && !isEthereum && <RewardsButton />}
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
    </Box>
  );
}

export default Navbar;

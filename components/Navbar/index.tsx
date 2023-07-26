import React, { ReactNode, useCallback, useEffect, useMemo, useState } from 'react';
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
  useMediaQuery,
} from '@mui/material';

import CloseIcon from '@mui/icons-material/Close';
import MovingSharpIcon from '@mui/icons-material/MovingSharp';

import MenuIcon from '@mui/icons-material/Menu';
import GavelIcon from '@mui/icons-material/Gavel';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import RepeatRoundedIcon from '@mui/icons-material/RepeatRounded';
import { globals } from 'styles/theme';
import MobileMenu from 'components/MobileMenu';
import Link from 'next/link';
import Wallet from 'components/Wallet';
import SelectMarketsView from 'components/SelectMarketsView';
import { useMarketContext } from 'contexts/MarketContext';
import { useTranslation } from 'react-i18next';
import MaturityDateReminder from 'components/MaturityDateReminder';
import Faucet from 'components/operations/Faucet';
import SecondaryChain from 'components/SecondaryChain';
import RewardsModal from 'components/RewardsModal';
import StakingModal from 'components/StakingModal';

const { onlyMobile, onlyDesktopFlex } = globals;

function Navbar() {
  const { t } = useTranslation();
  const { connector } = useConfig();
  const { walletAddress } = useWeb3();
  const { pathname: currentPathname, query } = useRouter();
  const { chain, isConnected } = useWeb3();

  const { palette, spacing, breakpoints } = useTheme();
  const { view } = useMarketContext();
  const [openMenu, setOpenMenu] = useState<boolean>(false);
  const [openFaucet, setOpenFaucet] = useState(false);
  const [openRewardsModal, setOpenRewardsModal] = useState(false);
  const [openStakingModal, setOpenStakingModal] = useState(false);
  const isMobile = useMediaQuery(breakpoints.down('sm'));

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

  const isOPMainnet = chain?.id === optimism.id;

  const routes: {
    pathname: string;
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
        pathname: '/governance',
        name: t('Governance'),
        icon: <GavelIcon sx={{ fontSize: '13px' }} />,
        isNew: true,
      },
      ...(isOPMainnet
        ? [
            {
              pathname: '/bridge',
              name: t('Bridge & Swap'),
              icon: <RepeatRoundedIcon sx={{ fontSize: 14 }} />,
            },
          ]
        : []),
    ],
    [isOPMainnet, t],
  );

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
                          sx={{ background: palette.green, borderRadius: '4px', px: 0.5 }}
                        >
                          {t('New').toUpperCase()}
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
              <Chip label="Goerli Faucet" onClick={handleFaucetClick} sx={{ my: 'auto', display: onlyDesktopFlex }} />
            )}
            <Box display="flex" gap={0.5}>
              {!isMobile && <SecondaryChain />}
              <StakingModal
                isOpen={openStakingModal}
                open={() => setOpenStakingModal(true)}
                close={() => setOpenStakingModal(false)}
              />
              {!isMobile && (
                <RewardsModal
                  isOpen={openRewardsModal}
                  open={() => setOpenRewardsModal(true)}
                  close={() => setOpenRewardsModal(false)}
                />
              )}
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

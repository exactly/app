import React, { ReactNode, useCallback, useContext, useEffect, useState } from 'react';
import { setContext, setUser } from '@sentry/nextjs';
import { goerli, useClient } from 'wagmi';
import DisclaimerModal from 'components/DisclaimerModal';
import Image from 'next/image';
import { useRouter } from 'next/router';

import ThemeContext from 'contexts/ThemeContext';
import { useWeb3 } from 'hooks/useWeb3';

import { AppBar, Box, Button, Chip, IconButton, Toolbar, useMediaQuery, useTheme } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import AccountBalanceWalletIcon from '@mui/icons-material/AccountBalanceWallet';
import { globals } from 'styles/theme';
import analytics from 'utils/analytics';
import { useModalStatus } from 'contexts/ModalStatusContext';
import MobileMenu from 'components/MobileMenu';
import Link from 'next/link';
import Wallet from 'components/Wallet';
import SelectMarketsView from 'components/SelectMarketsView';
import { MarketContext } from 'contexts/MarketContext';
import ClaimRewards from 'components/ClaimRewards';
import SelectDisplayNetwork from 'components/SelectDisplayNetwork';
const { onlyMobile, onlyDesktopFlex } = globals;

const routes: {
  pathname: string;
  name: string;
  custom?: ReactNode;
  icon?: ReactNode;
}[] = [
  { pathname: '/', name: 'Markets', custom: <SelectMarketsView /> },
  {
    pathname: '/dashboard',
    name: 'Dashboard',
    icon: <AccountBalanceWalletIcon sx={{ fontSize: '14px', my: 'auto' }} />,
  },
];

function Navbar() {
  const { connector } = useClient();
  const { walletAddress } = useWeb3();
  const { pathname: currentPathname } = useRouter();
  const { chain, isConnected } = useWeb3();

  const { theme } = useContext(ThemeContext);
  const { palette, breakpoints } = useTheme();
  const { view } = useContext(MarketContext);
  const { openOperationModal } = useModalStatus();
  const [openMenu, setOpenMenu] = useState<boolean>(false);

  const isMobile = useMediaQuery(breakpoints.down('sm'));

  useEffect(() => {
    if (!walletAddress) return;

    setUser({ id: walletAddress });
    setContext('wallet', { connector: connector?.id, name: connector?.name });
    setContext('chain', { id: chain?.id, name: chain?.name, network: chain?.network, testnet: chain?.testnet });
    void analytics.identify(walletAddress);
  }, [walletAddress, connector, chain]);

  const handleFaucetClick = useCallback(() => {
    if (chain?.id === goerli.id) return openOperationModal('faucet');
  }, [chain?.id, openOperationModal]);

  const setBodyColor = (color: string) => {
    document.body.style.backgroundColor = color;
  };

  useEffect(() => {
    view === 'simple' && currentPathname === '/'
      ? setBodyColor(palette.markets.simple)
      : setBodyColor(palette.markets.advanced);
  }, [currentPathname, view, palette.markets.advanced, palette.markets.simple]);

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <DisclaimerModal />
      <AppBar position="static" color="transparent" sx={{ height: '56px', mb: { xs: 0, sm: 2.5 } }}>
        <Toolbar disableGutters sx={{ padding: '0 0', gap: '8px' }}>
          <Link href="/" legacyBehavior>
            <Box mr="10px" sx={{ cursor: 'pointer' }} display="flex" alignItems="center">
              {isMobile ? (
                <Image
                  src={theme === 'light' ? '/img/isologo.svg' : '/img/isologo-white.svg'}
                  alt="Exactly Logo"
                  width={26}
                  height={26}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              ) : (
                <Image
                  src={theme === 'light' ? '/img/logo.svg' : '/img/logo-white.png'}
                  alt="Exactly Logo"
                  width={103}
                  height={30}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
              )}
            </Box>
          </Link>
          <Box display="flex" gap={0.2}>
            {routes.map(({ name, pathname, custom, icon }) => (
              <Box key={pathname} display={onlyDesktopFlex}>
                {custom || (
                  <Link href={pathname} legacyBehavior>
                    <Button
                      sx={{
                        px: 1.5,
                        color: currentPathname === pathname ? 'white' : 'grey.700',
                        display: 'flex',
                        fontSize: '14px',
                        fontWeight: 700,
                        gap: 0.5,
                      }}
                      variant={pathname === currentPathname ? 'contained' : 'text'}
                    >
                      {icon}
                      <Box my="auto">{name}</Box>
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
            <SelectDisplayNetwork />
            <ClaimRewards />
            <Wallet />
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

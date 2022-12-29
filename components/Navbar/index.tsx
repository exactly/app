import { goerli, useClient } from 'wagmi';
import DisclaimerModal from 'components/DisclaimerModal';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useState } from 'react';

import ThemeContext from 'contexts/ThemeContext';
import { useWeb3 } from 'hooks/useWeb3';

import { AppBar, Box, Chip, IconButton, Toolbar } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { globals } from 'styles/theme';
import analytics from 'utils/analytics';
import { useModalStatus } from 'contexts/ModalStatusContext';
import MobileMenu from 'components/MobileMenu';
import Link from 'next/link';
import Wallet from 'components/Wallet';
import SelectNetwork from 'components/SelectNetwork';
const { maxWidth, onlyMobile, onlyDesktop, onlyDesktopFlex } = globals;

const routes = [
  { pathname: '/', name: 'Markets' },
  { pathname: '/dashboard', name: 'Dashboard' },
];

function Navbar() {
  const { connector } = useClient();
  const { walletAddress } = useWeb3();
  const { pathname: currentPathname, query } = useRouter();
  const { chain, isConnected } = useWeb3();

  const { openOperationModal } = useModalStatus();
  const { theme } = useContext(ThemeContext);
  const [openMenu, setOpenMenu] = useState<boolean>(false);

  useEffect(() => {
    walletAddress && void analytics.identify(walletAddress);
  }, [walletAddress]);

  async function handleFaucetClick() {
    if (chain?.id === goerli.id) return openOperationModal('faucet');
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
      <DisclaimerModal />
      <AppBar position="static" color="transparent" sx={{ maxWidth }}>
        <Toolbar disableGutters sx={{ padding: '0 0', gap: '8px' }}>
          <Link href={{ pathname: '/', query }} legacyBehavior>
            <Box mr="10px" sx={{ cursor: 'pointer' }}>
              <Image
                src={theme === 'light' ? '/img/logo.svg' : '/img/logo-white.png'}
                alt="Exactly Logo"
                width={103}
                height={30}
              />
            </Box>
          </Link>
          {routes.map(({ name, pathname }) => (
            <Link key={pathname} href={{ pathname, query }} legacyBehavior>
              <Box
                sx={{
                  mx: '8px',
                  py: '4px',
                  display: onlyDesktop,
                  cursor: 'pointer',
                  color: currentPathname === pathname ? 'primary' : 'grey.600',
                  borderBottom: currentPathname === pathname ? '2px solid' : '2px solid transparent',
                  ':hover': { borderBottom: '2px solid' },
                  fontSize: '14px',
                  fontWeight: 700,
                }}
              >
                {name}
              </Box>
            </Link>
          ))}
          <Box display="flex" gap={0.5} ml="auto" flexDirection={{ xs: 'row-reverse', sm: 'row' }}>
            {isConnected && chain?.id === goerli.id && (
              <Chip label="Goerli Faucet" onClick={handleFaucetClick} sx={{ my: 'auto', display: onlyDesktopFlex }} />
            )}
            {connector?.switchChain && <SelectNetwork />}
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
          <Box display={onlyMobile}>
            <MobileMenu open={openMenu} handleClose={() => setOpenMenu(false)} />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;

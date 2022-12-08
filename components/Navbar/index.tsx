import { useSwitchNetwork } from 'wagmi';
import DisclaimerModal from 'components/DisclaimerModal';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { useRouter } from 'next/router';
import React, { useContext, useEffect, useMemo } from 'react';

const Wallet = dynamic(() => import('components/Wallet'));

import ThemeContext from 'contexts/ThemeContext';
import { useWeb3 } from 'hooks/useWeb3';

import { AppBar, Box, Button, Chip, Toolbar } from '@mui/material';
import allowedNetworks from 'config/allowedNetworks.json';
import { globals } from 'styles/theme';
import analytics from 'utils/analytics';
import { useModalStatus } from 'contexts/ModalStatusContext';
const { maxWidth } = globals;

const routes = [
  { pathname: '/', name: 'Markets' },
  { pathname: '/dashboard', name: 'Dashboard' },
];

function Navbar() {
  const { walletAddress } = useWeb3();
  const { switchNetworkAsync } = useSwitchNetwork();
  const { pathname: currentPathname, query, push } = useRouter();
  const { chain } = useWeb3();

  const { openOperationModal } = useModalStatus();
  const { theme } = useContext(ThemeContext);

  useEffect(() => {
    walletAddress && void analytics.identify(walletAddress);
  }, [walletAddress]);

  const isAllowed = useMemo(() => chain && allowedNetworks.includes(chain.network), [chain]);

  async function handleFaucetClick() {
    if (!switchNetworkAsync) return;

    if (isAllowed && chain?.id === 5) {
      return openOperationModal('faucet');
    }

    if (!isAllowed) await switchNetworkAsync(5);
  }

  return (
    <Box sx={{ display: 'flex', justifyContent: 'center' }} mb="20px">
      <DisclaimerModal />
      <AppBar position="static" color="transparent" sx={{ maxWidth }}>
        <Toolbar disableGutters sx={{ padding: '16px 0', gap: '8px' }}>
          <Box mr="10px" onClick={() => push('/markets', query)} sx={{ cursor: 'pointer' }}>
            <Image
              src={theme === 'light' ? '/img/logo.svg' : '/img/logo-white.png'}
              alt="Exactly Logo"
              layout="fixed"
              width={103}
              height={30}
            />
          </Box>
          {routes.map(({ name, pathname }) => (
            <Button
              key={pathname}
              variant={pathname === currentPathname ? 'contained' : 'text'}
              onClick={() => push(pathname, query)}
            >
              <Box px="6px">{name}</Box>
            </Button>
          ))}
          <Box sx={{ display: 'flex', gap: '10px', ml: 'auto' }}>
            {/* TODO: put chainId constants in a config file */}
            {chain?.id === 5 && <Chip label="Goerli Faucet" onClick={handleFaucetClick} sx={{ my: 'auto' }} />}
            <Wallet />
          </Box>
        </Toolbar>
      </AppBar>
    </Box>
  );
}

export default Navbar;

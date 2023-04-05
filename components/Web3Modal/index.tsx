import React from 'react';

import { Web3Modal as _Web3Modal } from '@web3modal/react';
import { useTheme } from '@mui/material';

import { walletConnectId } from 'utils/chain';
import { web3modal } from 'utils/client';
import { useNetworkContext } from 'contexts/NetworkContext';

export default function Web3Modal() {
  const { palette } = useTheme();
  const { displayNetwork } = useNetworkContext();
  return (
    <_Web3Modal
      projectId={walletConnectId}
      ethereumClient={web3modal}
      defaultChain={displayNetwork}
      enableAccountView={false}
      themeMode={palette.mode}
      themeVariables={{ '--w3m-background-color': '#0D0E0F' }}
      walletImages={{ safe: '/img/wallets/safe.png' }}
      chainImages={{ 1: '/img/networks/1.svg' }}
    />
  );
}

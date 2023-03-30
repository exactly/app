'use client';

import React, { type FC } from 'react';
import { useTheme } from '@mui/material';
import { Web3Modal } from '@web3modal/react';

import { walletConnectId, web3modal } from 'utils/client';
import { useNetworkContext } from 'contexts/NetworkContext';

const Web3ModalWrapper: FC = () => {
  const { palette } = useTheme();
  const { displayNetwork } = useNetworkContext();
  return (
    <Web3Modal
      projectId={walletConnectId}
      ethereumClient={web3modal}
      defaultChain={displayNetwork}
      enableAccountView={false}
      themeMode={palette.mode}
      themeColor="blackWhite"
      themeBackground="themeColor"
      walletImages={{ safe: '/img/wallets/safe.png' }}
      chainImages={{ 1: '/img/networks/1.svg' }}
    />
  );
};

export default Web3ModalWrapper;

import React, { type FC, useCallback, useMemo, useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import { ModalCtrl, RouterCtrl } from '@web3modal/core';
import { useWeb3 } from 'hooks/useWeb3';

import ErrorIcon from '@mui/icons-material/Error';
import { Box, Button } from '@mui/material';
import { goerli, mainnet, useNetwork } from 'wagmi';
import Image from 'next/image';
import { globals } from 'styles/theme';
const { onlyDesktop } = globals;

const SelectNetwork: FC = () => {
  const { chain } = useNetwork();
  const { chains } = useWeb3();
  const { close, open } = useWeb3Modal();

  const [unsubscribe, setUnsubscribe] = useState<(() => void) | undefined>(undefined);
  const openMenu = useCallback(() => {
    open({ route: 'SelectNetwork' });

    let localUnsubscribe: (() => void) | undefined = undefined;
    const modalUnsubscribe = ModalCtrl.subscribe(({ open: isOpen }) => !isOpen && localUnsubscribe?.());
    const routerUnsubscribe = RouterCtrl.subscribe(({ view }) => view === 'Account' && close());
    localUnsubscribe = () => {
      setUnsubscribe(undefined);
      routerUnsubscribe();
      modalUnsubscribe();
    };
    setUnsubscribe(() => localUnsubscribe);
  }, [close, open]);
  useEffect(() => () => unsubscribe?.(), [unsubscribe]);

  const isSupportedChain = useMemo(() => chain?.id && chains.map((c) => c.id).includes(chain.id), [chain?.id, chains]);

  const buttonBgColor = useMemo(
    () => (chain?.id === mainnet.id || chain?.id === goerli.id ? '#627EEA' : '#EE2939'),
    [chain?.id],
  );

  return (
    <Button
      onClick={openMenu}
      sx={{
        pr: '10px',
        pl: '6px',
        minWidth: { xs: '45px', sm: '100px' },
        borderRadius: '32px',
        bgcolor: buttonBgColor,
        color: 'white',
        '&:hover': {
          bgcolor: buttonBgColor,
          filter: 'brightness(1.1)',
        },
      }}
    >
      <Box display="flex" gap={0.5} mr={{ xs: 0, sm: 1 }} ml="3px">
        {isSupportedChain ? (
          <Image src={`/img/networks/${chain?.id}.svg`} alt={`chain id ${chain?.id}`} width={24} height={24} />
        ) : (
          <ErrorIcon />
        )}
        <Box display={onlyDesktop}>{isSupportedChain ? chain?.name : 'Unsupported network'}</Box>
      </Box>
    </Button>
  );
};

export default SelectNetwork;

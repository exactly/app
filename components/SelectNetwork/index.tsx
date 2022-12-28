import React, { type FC, useCallback, useMemo, useState, useEffect } from 'react';
import { useWeb3Modal } from '@web3modal/react';
import { RouterCtrl } from '@web3modal/core';
import { useWeb3 } from 'hooks/useWeb3';

import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import ErrorIcon from '@mui/icons-material/Error';
import { LoadingButton } from '@mui/lab';
import { Box, CircularProgress, Divider, Menu, MenuItem, Typography } from '@mui/material';
import { goerli, mainnet, useNetwork } from 'wagmi';
import Image from 'next/image';
import { globals } from 'styles/theme';
const { onlyDesktop } = globals;

const SelectNetwork: FC = () => {
  const { chain } = useNetwork();
  const { chains } = useWeb3();
  const { close, open, isOpen } = useWeb3Modal();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget),
    [setAnchorEl],
  );
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);

  const [unsubscribe, setUnsubscribe] = useState<(() => void) | undefined>(undefined);
  const onSelectNetwork = useCallback(
    (chainId: number) => {
      closeMenu();

      RouterCtrl.replace('SwitchNetwork');
      RouterCtrl.state.data = { SwitchNetwork: chains.find((c) => c.id === chainId) };
      open();

      setUnsubscribe(() => RouterCtrl.subscribe(({ view }) => view === 'Account' && close()));
    },
    [chains, close, closeMenu, open],
  );
  useEffect(
    () => () => {
      unsubscribe?.();
      setUnsubscribe(undefined);
    },
    [unsubscribe, isOpen],
  );

  const isSupportedChain = useMemo(() => chain?.id && chains.map((c) => c.id).includes(chain.id), [chain?.id, chains]);

  const buttonBgColor = useMemo(
    () => (chain?.id === mainnet.id || chain?.id === goerli.id ? '#627EEA' : '#EE2939'),
    [chain?.id],
  );

  return (
    <>
      <LoadingButton
        loadingIndicator={<CircularProgress sx={{ color: 'white' }} size={16} />}
        onClick={openMenu}
        sx={{
          pr: '10px',
          pl: '6px',
          minWidth: { xs: '60px', sm: '120px' },
          borderRadius: '32px',
          bgcolor: buttonBgColor,
          color: 'white',
          '&:hover': {
            bgcolor: buttonBgColor,
            filter: 'brightness(1.1)',
          },
        }}
      >
        <Box display="flex" justifyContent="space-between" width="100%" gap={{ xs: 0, sm: 1 }}>
          <Box display="flex" gap={0.5}>
            {isSupportedChain ? (
              <Image src={`/img/networks/${chain?.id}.svg`} alt={`chain id ${chain?.id}`} width={24} height={24} />
            ) : (
              <ErrorIcon />
            )}
            <Box display={onlyDesktop}>{isSupportedChain ? chain?.name : 'Unsupported network'}</Box>
          </Box>
          {anchorEl ? (
            <ExpandLessIcon sx={{ my: 'auto' }} fontSize="small" />
          ) : (
            <ExpandMoreIcon sx={{ my: 'auto' }} fontSize="small" />
          )}
        </Box>
      </LoadingButton>
      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={closeMenu}
        MenuListProps={{
          'aria-labelledby': 'basic-button',
        }}
        PaperProps={{
          style: {
            padding: '8px',
            boxShadow: '0px 4px 12px rgba(175, 177, 182, 0.2)',
            borderRadius: '2px',
            minWidth: '270px',
          },
        }}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'left',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'left',
        }}
      >
        {chains
          .filter((c) => !c?.testnet)
          .map(({ id, name }) => (
            <MenuItem
              key={`mainnnet_chain_${id}`}
              value={id}
              onClick={() => onSelectNetwork(id)}
              sx={{ bgcolor: chain?.id === id ? '#F9FAFB' : 'transparent', py: 1 }}
            >
              <Box display="flex" justifyContent="space-between" width="100%">
                <Box display="flex" gap={1}>
                  <Image src={`/img/networks/${id}.svg`} alt={`chain id ${id}`} width={24} height={24} />
                  <Typography fontSize="16px" fontWeight={700}>
                    {name}
                  </Typography>
                </Box>

                {chain?.id === id && <FiberManualRecordIcon sx={{ fontSize: '10px', my: 'auto' }} />}
              </Box>
            </MenuItem>
          ))}
        {chains.find((c) => c?.testnet) && (
          <Box>
            <Divider />
            {chains
              .filter((c) => c?.testnet)
              .map(({ id, name }) => (
                <MenuItem
                  key={`testnet_chain_${id}`}
                  value={id}
                  onClick={() => onSelectNetwork(id)}
                  sx={{ bgcolor: chain?.id === id ? '#F9FAFB' : 'transparent' }}
                >
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Box display="flex" gap={1}>
                      <Image src={`/img/networks/${id}.svg`} alt={`chain id ${id}`} width={24} height={24} />
                      <Typography fontSize="16px" fontWeight={700}>
                        {name}
                      </Typography>
                      <Typography
                        variant="subtitle2"
                        py="2px"
                        px="4px"
                        bgcolor="grey.200"
                        color="grey.600"
                        fontSize="9px"
                        my="auto"
                      >
                        TESTNET
                      </Typography>
                    </Box>
                    {chain?.id === id && <FiberManualRecordIcon sx={{ fontSize: '10px', my: 'auto' }} />}
                  </Box>
                </MenuItem>
              ))}
          </Box>
        )}
      </Menu>
    </>
  );
};

export default SelectNetwork;

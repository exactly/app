import React, { type FC, useCallback, useMemo, useState, useContext } from 'react';
import { usePathname, useSearchParams } from 'next/navigation';
import Router from 'next/router';

import { useWeb3 } from 'hooks/useWeb3';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import FiberManualRecordIcon from '@mui/icons-material/FiberManualRecord';
import { LoadingButton } from '@mui/lab';
import { Box, CircularProgress, Divider, Menu, MenuItem, Typography } from '@mui/material';
import { Chain, goerli, mainnet } from 'wagmi';
import Image from 'next/image';
import { globals } from 'styles/theme';
import { useNetworkContext } from 'contexts/NetworkContext';
import { MarketContext } from 'contexts/MarketContext';
import useAccountData from 'hooks/useAccountData';

const { onlyDesktop } = globals;

const SelectDisplayNetwork: FC = () => {
  const { setMarketSymbol } = useContext(MarketContext);
  const pathname = usePathname();
  const query = useSearchParams();
  const { chains, chain } = useWeb3();
  const { setDisplayNetwork } = useNetworkContext();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const openMenu = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => setAnchorEl(event.currentTarget),
    [setAnchorEl],
  );
  const closeMenu = useCallback(() => setAnchorEl(null), [setAnchorEl]);

  const { resetAccountData } = useAccountData();

  const onSelectNetwork = useCallback(
    (displayChain: Chain) => {
      closeMenu();
      if (displayChain.id === chain.id) return;
      setMarketSymbol('USDC');

      if (!['/', '/dashboard'].includes(pathname)) {
        return Router.push({
          pathname: '/',
          query: {
            ...Object.fromEntries(Array.from(query.entries()).filter((e) => e[0] !== 'symbol')),
            n: `${{ [mainnet.id]: 'mainnet' }[displayChain.id] ?? displayChain.network}`,
          },
        }).then(() => {
          resetAccountData();
          setDisplayNetwork(displayChain);
        });
      }

      resetAccountData();
      setDisplayNetwork(displayChain);
    },
    [chain.id, closeMenu, resetAccountData, setDisplayNetwork, pathname, setMarketSymbol, query],
  );

  const { buttonBgColor, image } = useMemo(() => {
    return {
      buttonBgColor: chain?.id === mainnet.id || chain?.id === goerli.id ? '#627EEA' : '#EE2939',
      image: `/img/networks/${chain?.id}.svg`,
    };
  }, [chain?.id]);

  return (
    <>
      <LoadingButton
        loadingIndicator={<CircularProgress sx={{ color: 'components.bg' }} size={16} />}
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
            <Image src={image} alt={`image ${image}`} width={24} height={24} />
            <Box display={onlyDesktop} my="auto">
              {chain?.name}
            </Box>
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
            marginTop: '8px',
            padding: '0 8px',
            boxShadow: '0px 4px 12px rgba(175, 177, 182, 0.2)',
            borderRadius: 16,
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
          .map((c) => (
            <MenuItem
              key={`mainnnet_chain_${c.id}`}
              value={c.id}
              onClick={() => onSelectNetwork(c)}
              sx={{ bgcolor: chain?.id === c.id ? 'markets.advanced' : 'transparent', py: 1, borderRadius: 1 }}
            >
              <Box display="flex" justifyContent="space-between" width="100%">
                <Box display="flex" gap={1}>
                  <Image src={`/img/networks/${c.id}.svg`} alt={`chain id ${c.id}`} width={24} height={24} />
                  <Typography fontSize="16px" fontWeight={700}>
                    {c.name}
                  </Typography>
                </Box>

                {chain?.id === c.id && <FiberManualRecordIcon sx={{ fontSize: '9px', my: 'auto' }} />}
              </Box>
            </MenuItem>
          ))}
        {chains.find((c) => c?.testnet) && (
          <Box>
            <Divider />
            {chains
              .filter((c) => c?.testnet)
              .map((c) => (
                <MenuItem
                  key={`testnet_chain_${c.id}`}
                  value={c.id}
                  onClick={() => onSelectNetwork(c)}
                  sx={{ bgcolor: chain?.id === c.id ? 'markets.advanced' : 'transparent', borderRadius: 1 }}
                >
                  <Box display="flex" justifyContent="space-between" width="100%">
                    <Box display="flex" gap={1}>
                      <Image src={`/img/networks/${c.id}.svg`} alt={`chain id ${c.id}`} width={24} height={24} />
                      <Typography fontSize="16px" fontWeight={700}>
                        {c.name}
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
                    {chain?.id === c.id && <FiberManualRecordIcon sx={{ fontSize: '9px', my: 'auto' }} />}
                  </Box>
                </MenuItem>
              ))}
          </Box>
        )}
      </Menu>
    </>
  );
};

export default SelectDisplayNetwork;

import React, { useCallback, useEffect, useState, memo } from 'react';
import SocketPlugIn from 'components/BridgeContent/SocketPlugIn';
import { Box, Typography } from '@mui/material';
import { t } from 'i18next';
import { ActiveRoute } from 'types/Bridge';
import { useWeb3 } from 'hooks/useWeb3';
import { fetchActiveRoutes } from './utils';
import SocketTxHistory from './SocketTxHistory';

const BridgeContent = () => {
  const [activeRoutes, setActiveRoutes] = useState<ActiveRoute[] | undefined>();
  const { walletAddress } = useWeb3();

  const updateRoutes = useCallback(async () => {
    if (!walletAddress) {
      setActiveRoutes([]);
      return;
    }
    const routes = await fetchActiveRoutes(walletAddress);
    setActiveRoutes(routes);
  }, [walletAddress]);

  useEffect(() => {
    updateRoutes();
  }, [updateRoutes, walletAddress]);

  return (
    <Box display="flex" justifyContent="center" flexDirection="column" mx="auto" mt={5} gap={2}>
      <Box>
        <Typography variant="h2" fontSize={24} mb={2}>
          {t('Bridge & Swap')}
        </Typography>
        <Typography variant="body1" fontSize={16}>
          {t(
            "Seamlessly bridge and swap assets to OP Mainnet from many different networks with ease. Experience a unified and streamlined approach to managing your assets effortlessly and start using Exactly's features.",
          )}
        </Typography>
      </Box>
      <Box my={4} display="flex" gap={2} flexWrap="wrap" justifyContent="center">
        <SocketPlugIn updateRoutes={updateRoutes} />
        <SocketTxHistory activeRoutes={activeRoutes} />
      </Box>
    </Box>
  );
};

export default memo(BridgeContent);

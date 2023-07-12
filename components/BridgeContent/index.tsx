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

  const updateRutes = useCallback(async () => {
    if (!walletAddress) return;
    const routes = await fetchActiveRoutes(walletAddress);
    setActiveRoutes(routes);
  }, [walletAddress]);

  useEffect(() => {
    updateRutes();
  }, [updateRutes, walletAddress]);

  return (
    <Box
      sx={{ display: 'flex', justifyContent: 'center' }}
      flexDirection={'column'}
      mx={'auto'}
      mt={'40px'}
      gap={'16px'}
      maxWidth={'1440px'}
    >
      <Box>
        <Typography variant="h2" fontSize={'24px'} mb={'16px'}>
          {t('Bridge & Swap')}
        </Typography>
        <Typography variant="body1" fontSize={'16px'}>
          {t(
            "Seamlessly bridge and swap assets to OP Mainnet from many different networks with ease. Experience a unified and streamlined approach to managing your assets effortlessly and start using Exactly's features.",
          )}
        </Typography>
      </Box>
      <Box
        my={'32px'}
        display={'flex'}
        flexDirection={'row'}
        alignItems={'start'}
        gap={2}
        flexWrap={'wrap'}
        justifyContent={'center'}
      >
        <SocketPlugIn updateRutes={updateRutes} />
        {<SocketTxHistory activeRoutes={activeRoutes} />}
      </Box>
    </Box>
  );
};

export default memo(BridgeContent);

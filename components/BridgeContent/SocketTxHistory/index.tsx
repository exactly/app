import React, { memo, useCallback, useEffect, useMemo, useState } from 'react';

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ActiveRoute, Chain } from 'types/Bridge';
import { globals } from 'styles/theme';
import { routeToTxData } from './utils';
import TxTable from './TxTable';
import TxsMobile from './TxMobile';
import Placeholder from './Placeholder';

type Props = {
  activeRoutes?: ActiveRoute[];
};

const SocketTxHistory = ({ activeRoutes }: Props) => {
  const { t } = useTranslation();
  const { onlyMobile, onlyDesktopFlex } = globals;
  const [chains, setChains] = useState<Chain[]>();
  const txData = useMemo(() => activeRoutes?.map(routeToTxData), [activeRoutes]);

  const fetchChains = useCallback(async () => {
    const { result } = await fetch('https://api.socket.tech/v2/supported/chains', {
      headers: {
        'API-KEY': process.env.NEXT_PUBLIC_SOCKET_API_KEY || '',
      },
    }).then((res) => res.json());

    setChains(result);
  }, []);

  useEffect(() => {
    fetchChains();
  }, [fetchChains]);

  return (
    <Box p={4} borderRadius={1} flex={1} bgcolor="components.bg" minHeight="100%" boxShadow="0px 3px 4px 0px #61666B1A">
      {activeRoutes?.length === 0 ? (
        <Box display="flex" flexDirection="column" alignItems="center" gap={2} justifyContent="center" height="100%">
          <Box mb={6}>
            <Placeholder />
          </Box>
          <Typography variant="h6">{t('No Transactions yet.')}</Typography>
          <Typography fontSize={14} fontWeight={500} textAlign="center" color="grey.400">
            {t('Start bridging and swapping to see your transaction history here.')}
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="h2" fontSize={19} mb={3} fontWeight={700}>
            {t('Transaction History')}
          </Typography>

          <Box display={onlyDesktopFlex}>
            <TxTable txsData={txData} chains={chains} />
          </Box>
          <Box display={onlyMobile}>
            <TxsMobile txsData={txData} chains={chains} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default memo(SocketTxHistory);

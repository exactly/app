import React, { memo, useMemo } from 'react';

import { Box, Typography } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { ActiveRoute } from 'types/Bridge';
import { globals } from 'styles/theme';
import { routeToTxData } from './utils';
import TxTable from './TxTable';
import TxsMobile from './TxMobile';
import Placeholder from './Placeholder';

type Props = {
  activeRoutes: ActiveRoute[];
};

const SocketTxHistory = ({ activeRoutes }: Props) => {
  const { t } = useTranslation();
  const { onlyMobile, onlyDesktopFlex } = globals;
  const txData = useMemo(() => activeRoutes.map(routeToTxData), [activeRoutes]);

  return (
    <Box p={'32px'} borderRadius={'8px'} flex={1} bgcolor="components.bg" boxShadow={'0px 3px 4px 0px #61666B1A'}>
      {activeRoutes.length === 0 ? (
        <Box
          display={'flex'}
          flexDirection={'column'}
          alignItems={'center'}
          gap={'16px'}
          justifyContent={'center'}
          height={'100%'}
        >
          <Box marginBottom={'48px'}>
            <Placeholder />
          </Box>
          <Typography fontSize={'19px'} fontWeight={700}>
            No Transactions yet.
          </Typography>
          <Typography fontSize={'14px'} fontWeight={500} textAlign={'center'}>
            Start bridging and swapping to see your transaction history here.
          </Typography>
        </Box>
      ) : (
        <>
          <Typography variant="h2" fontSize={'19px'} mb={'24px'} fontWeight={700}>
            {t('Transaction History')}
          </Typography>

          <Box display={onlyDesktopFlex}>
            <TxTable txsData={txData} />
          </Box>
          <Box display={onlyMobile}>
            <TxsMobile txsData={txData} />
          </Box>
        </>
      )}
    </Box>
  );
};

export default memo(SocketTxHistory);

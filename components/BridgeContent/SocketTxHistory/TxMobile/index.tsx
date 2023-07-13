import React, { memo, useCallback, useState } from 'react';

import Image from 'next/image';
import { formatUnits } from 'viem';
import { Box, Typography } from '@mui/material';

import formatNumber from 'utils/formatNumber';
import { Chain, TxData } from 'types/Bridge';
import { ChevronRight } from '@mui/icons-material';
import TxModal from './TxModal';
import MobileSkeletons from './MobileSkeletons';

type Props = { txsData?: TxData[]; chains: Chain[] };

const TxMobile = ({ txData, chains }: { txData: TxData; chains: Chain[] }) => {
  const {
    protocol,
    status: { Icon, color },
    type,
    route: { fromAmount, toAmount, fromAsset, toAsset, activeRouteId },
  } = txData;

  const [modalOpen, setModalOpen] = useState(false);
  const handleOpen = useCallback(() => setModalOpen(true), []);
  const handleClose = useCallback(() => setModalOpen(false), []);

  return (
    <>
      <TxModal open={modalOpen} closeModal={handleClose} txData={txData} chains={chains} />
      <button key={activeRouteId} style={{ all: 'unset', cursor: 'pointer' }} onClick={handleOpen}>
        <Box display="flex" border={1} borderColor="grey.200" borderRadius={0.5} p={2} alignItems="center">
          <Box gap={1} flexDirection={'column'} display="flex">
            <Box display="flex" alignItems="center" gap={0.5}>
              <Icon sx={{ color, fontSize: 18 }} />
              <Typography variant="body1" fontSize={14} fontWeight={500}>
                {formatNumber(formatUnits(BigInt(fromAmount), fromAsset.decimals))} {fromAsset.symbol} -{' '}
                {formatNumber(formatUnits(BigInt(toAmount), toAsset.decimals))} {toAsset.symbol}
              </Typography>
            </Box>
            {protocol && (
              <Box display="flex" alignItems="center" gap={0.5}>
                <Image
                  src={protocol.icon}
                  alt={protocol.displayName}
                  width={20}
                  height={20}
                  style={{
                    maxWidth: '100%',
                    borderRadius: '100%',
                  }}
                />
                <Typography fontSize={12} fontWeight={600}>
                  {protocol.displayName}
                </Typography>
                <Typography fontSize={12} fontWeight={600} color="grey.500">
                  {type}
                </Typography>
              </Box>
            )}
          </Box>
          <Box marginLeft="auto" bgcolor="grey.200" borderRadius="100%" width={24} height={24}>
            <ChevronRight sx={{ color: 'grey.500' }} />
          </Box>
        </Box>
      </button>
    </>
  );
};

const TxsMobile = ({ txsData, chains }: Props) => {
  return (
    <Box display="flex" gap={1} flexDirection={'column'}>
      {txsData ? (
        txsData.map((txData) => <TxMobile key={txData.route.activeRouteId} txData={txData} chains={chains} />)
      ) : (
        <MobileSkeletons />
      )}
    </Box>
  );
};

export default memo(TxsMobile);

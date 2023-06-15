import { Box, Skeleton, Typography } from '@mui/material';
import React, { FC } from 'react';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import USDValue from 'components/OperationsModal/USDValue';

type InfoRowProps = {
  title: string;
  symbol?: string;
  assets?: string;
  disabledMessage: string;
};

const InfoRow: FC<InfoRowProps> = ({ title, symbol, assets, disabledMessage }) => {
  return (
    <Box display="flex" alignItems="center" bgcolor="grey.100" borderRadius="4px" px={1} py={0.5} gap={1} mx={-1}>
      {symbol ? (
        <>
          <Typography variant="caption">{title}:</Typography>
          {assets ? (
            <>
              <Box display="flex" gap={0.5}>
                <Image
                  src={`/img/assets/${symbol}.svg`}
                  alt={symbol}
                  width={16}
                  height={16}
                  style={{
                    maxWidth: '100%',
                    height: 'auto',
                  }}
                />
                <Typography fontFamily="IBM Plex Mono" fontSize={13} fontWeight={500}>
                  {`${formatNumber(assets, symbol)} ${symbol}`}
                </Typography>
              </Box>
              <USDValue qty={assets} symbol={symbol} />
            </>
          ) : (
            <Skeleton width={200} height={24} />
          )}
        </>
      ) : (
        <Typography variant="caption" color="grey.700">
          {disabledMessage}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(InfoRow);

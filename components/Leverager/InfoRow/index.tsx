import { Box, Skeleton, Typography } from '@mui/material';
import React, { FC } from 'react';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';

type InfoRowProps = {
  title: string;
  symbol?: string;
  assets?: number;
  assetsUSD?: number;
};

const InfoRow: FC<InfoRowProps> = ({ title, symbol, assets, assetsUSD }) => {
  return (
    <Box display="flex" alignItems="center" bgcolor="grey.100" borderRadius="4px" px={1} py={0.5} gap={1} mx={-1}>
      <Typography variant="caption">{title}:</Typography>
      <Box display="flex" gap={0.5}>
        {symbol ? (
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
        ) : (
          <Skeleton width={24} height={24} />
        )}
        {symbol && assets ? (
          <Typography fontFamily="IBM Plex Mono" fontSize={13} fontWeight={500}>
            {`${formatNumber(assets, symbol)} ${symbol}`}
          </Typography>
        ) : (
          <Skeleton width={60} height={24} />
        )}
      </Box>
      {assetsUSD ? (
        <Typography variant="caption" fontSize={13}>
          ~{formatNumber(assetsUSD, 'USD', true)}
        </Typography>
      ) : (
        <Skeleton width={80} height={24} />
      )}
    </Box>
  );
};

export default React.memo(InfoRow);

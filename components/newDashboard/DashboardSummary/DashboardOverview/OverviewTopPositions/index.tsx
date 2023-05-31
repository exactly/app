import React, { FC } from 'react';
import { Box, Divider, Grid, Typography } from '@mui/material';
import Image from 'next/image';
import formatSymbol from 'utils/formatSymbol';
import OperationLegend from 'components/common/OperationLegend';

export type TopAssetPosition = {
  symbol: string;
  type: 'fixed' | 'variable';
  totalUSD: string;
  apr: string;
};

type OverviewTopPositionsProps = {
  assets?: TopAssetPosition[];
};

const OverviewTopPositions: FC<OverviewTopPositionsProps> = ({ assets = [] }) => {
  return (
    <Box display="flex" flexDirection="column" gap={1.5}>
      {assets.map(({ symbol, type, totalUSD, apr }, index) => (
        <Box display="flex" flexDirection="column" gap={0.5} key={`${symbol}_${type}_${totalUSD}_${apr}`}>
          <Grid display="flex" alignItems="center" justifyContent="center">
            <Grid item xs={4} display="flex" gap={0.5}>
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
              <Typography
                fontSize={14}
                lineHeight="16.94px"
                fontWeight={400}
                textTransform="uppercase"
                alignSelf="center"
              >
                {formatSymbol(symbol)}
              </Typography>
            </Grid>
            <Grid item xs={2}>
              <OperationLegend type={type} />
            </Grid>
            <Grid item xs={3} textAlign="end">
              <Typography fontFamily="IBM Plex Mono" fontSize={16} fontWeight={500} textTransform="uppercase">
                {totalUSD}
              </Typography>
            </Grid>
            <Grid item xs={3} textAlign="end">
              <Typography fontFamily="IBM Plex Mono" fontSize={16} fontWeight={500} textTransform="uppercase">
                {apr}
              </Typography>
            </Grid>
          </Grid>
          {index !== assets.length - 1 && <Divider sx={{ backgroundColor: 'grey.100' }} />}
        </Box>
      ))}
    </Box>
  );
};

export default OverviewTopPositions;

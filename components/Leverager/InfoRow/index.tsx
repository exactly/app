import { Box, Grid, Skeleton, Typography } from '@mui/material';
import React, { FC } from 'react';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import USDValue from 'components/OperationsModal/USDValue';

type InfoRowProps = {
  title: string;
  symbol?: string;
  assets?: string;
  disabledMessage: string;
  onClick?: () => void;
};

const InfoRow: FC<InfoRowProps> = ({ title, symbol, assets, disabledMessage, onClick }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      bgcolor="grey.100"
      borderRadius="4px"
      gap={1}
      onClick={onClick}
      sx={{
        ...(onClick ? { cursor: 'pointer' } : {}),
      }}
    >
      {symbol ? (
        <Grid container width="100%" alignItems="top">
          <Grid item xs={6}>
            <Typography variant="caption">{title}:</Typography>
          </Grid>

          <Grid item xs={6}>
            {assets ? (
              <Box display="flex" gap={0.5} alignItems="center" flexWrap="wrap">
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
                <Typography fontFamily="IBM Plex Mono" fontSize={13} fontWeight={500} sx={{ mr: 0.5 }}>
                  {formatNumber(assets, symbol)}
                </Typography>
                <USDValue qty={assets} symbol={symbol} />
              </Box>
            ) : (
              <Skeleton width={170} height={24} />
            )}
          </Grid>
        </Grid>
      ) : (
        <Typography variant="caption" color="grey.700">
          {disabledMessage}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(InfoRow);

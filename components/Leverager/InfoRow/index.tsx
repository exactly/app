import { Box, IconButton, Skeleton, Typography } from '@mui/material';
import React, { FC } from 'react';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';
import USDValue from 'components/OperationsModal/USDValue';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

type InfoRowProps = {
  title: string;
  symbol?: string;
  assets?: string;
  disabledMessage: string;
  expandable?: boolean;
};

const InfoRow: FC<InfoRowProps> = ({ title, symbol, assets, disabledMessage, expandable }) => {
  return (
    <Box
      display="flex"
      alignItems="center"
      bgcolor="grey.100"
      borderRadius="4px"
      pl={1}
      py={0.5}
      gap={1}
      pr={expandable ? 0 : 3.4}
    >
      {symbol ? (
        <Box display="flex" justifyContent="space-between" gap={1} width="100%">
          <Typography variant="caption">{title}:</Typography>
          {assets ? (
            <Box display="flex" gap={1}>
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
              {expandable && (
                <IconButton sx={{ width: 20, height: 20 }}>
                  <ExpandMoreIcon sx={{ fontSize: 14 }} />
                </IconButton>
              )}
            </Box>
          ) : (
            <Skeleton width={200} height={24} />
          )}
        </Box>
      ) : (
        <Typography variant="caption" color="grey.700">
          {disabledMessage}
        </Typography>
      )}
    </Box>
  );
};

export default React.memo(InfoRow);

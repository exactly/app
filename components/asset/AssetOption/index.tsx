import React from 'react';
import { Box, Skeleton, Typography } from '@mui/material';
import Image from 'next/image';

import formatSymbol from 'utils/formatSymbol';

type AssetOptionProps = {
  assetSymbol?: string;
  option?: boolean;
  optionSize?: number;
  selectedSize?: number;
  value?: string;
  unformattedSymbol?: boolean;
  'data-testid'?: string;
};

function AssetOption({
  assetSymbol,
  option = false,
  optionSize = 17,
  selectedSize = 21,
  value,
  unformattedSymbol = false,
  'data-testid': testId,
}: AssetOptionProps) {
  const size = option ? optionSize : selectedSize;

  if (!assetSymbol) {
    return <Skeleton width={80} />;
  }

  return (
    <Box
      display="flex"
      gap={3}
      my={0.5}
      mx={option ? 0.5 : 0}
      alignItems="center"
      justifyContent="space-between"
      width="100%"
      data-testid={testId}
    >
      <Box display="flex" gap={1} alignContent="center" justifyContent="center">
        <Image
          src={`/img/assets/${assetSymbol}.svg`}
          alt=""
          width={size}
          height={size}
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Typography fontWeight={700} fontSize={size} color="grey.900">
          {unformattedSymbol ? assetSymbol : formatSymbol(assetSymbol)}
        </Typography>
      </Box>
      <Box>
        {value && (
          <Typography fontFamily="IBM Plex Mono" fontSize={13} fontWeight={500} color="figma.grey.500">
            {value}
          </Typography>
        )}
      </Box>
    </Box>
  );
}

export default AssetOption;

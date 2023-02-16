import React from 'react';
import { BigNumber } from '@ethersproject/bignumber';
import { Box, Chip, Typography, useTheme } from '@mui/material';
import Image from 'next/image';

import { toPercentage } from 'utils/utils';

type Props = {
  symbol: string;
  rate: BigNumber;
};

function RewardPill({ symbol, rate }: Props) {
  const theme = useTheme();

  if (rate.isZero()) {
    return null;
  }

  return (
    <Chip
      label={
        <Box display="flex" alignItems="center" gap={0.5}>
          <Typography fontFamily="fontFamilyMonospaced" fontWeight={500} fontSize={12}>
            {toPercentage(Number(rate) / 1e18)}
          </Typography>
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
        </Box>
      }
      size="small"
      sx={{
        mb: 0.5,
        padding: '4px 5px 4px 4px',
        border: `1px solid ${theme.palette.grey[200]}`,
        backgroundColor: 'grey.100',
        color: 'grey.700',
        '& .MuiChip-label': {
          p: 0,
        },
      }}
    />
  );
}

export default React.memo(RewardPill);

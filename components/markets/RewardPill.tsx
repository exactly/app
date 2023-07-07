import React from 'react';
import { Box, Chip, Tooltip, Typography, useTheme } from '@mui/material';
import Image from 'next/image';

import { toPercentage } from 'utils/utils';
import { useTranslation } from 'react-i18next';

type Props = {
  symbol: string;
  rate: bigint;
};

function RewardPill({ symbol, rate }: Props) {
  const { t } = useTranslation();
  const theme = useTheme();

  if (rate === 0n) {
    return null;
  }

  return (
    <Tooltip
      title={t('This APR assumes a constant price for the {{symbol}} tokens and distribution rate.', { symbol })}
      placement="top"
      arrow
    >
      <Chip
        label={
          <Box display="flex" alignItems="center" gap={0.5}>
            <Typography fontWeight={500} fontSize={11}>
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
          padding: '4px 5px 4px 4px',
          border: `1px solid ${theme.palette.grey[200]}`,
          backgroundColor: 'grey.100',
          color: 'grey.700',
          '& .MuiChip-label': {
            p: 0,
          },
        }}
      />
    </Tooltip>
  );
}

export default React.memo(RewardPill);

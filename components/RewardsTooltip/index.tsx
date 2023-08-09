import React from 'react';
import { Box, Divider, Typography, useMediaQuery, useTheme } from '@mui/material';
import Image from 'next/image';
import formatNumber from 'utils/formatNumber';

type Props = { rewards: { symbol: string; amount: string; valueUSD?: string }[] };

const RewardsTooltip = ({ rewards }: Props) => {
  const { breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  if (isMobile) return null;

  return (
    <Box display="flex" flexDirection="column" gap={0.5} px={1.5} py={1.3}>
      {rewards.map(({ symbol, amount, valueUSD }, i) => (
        <Box key={symbol}>
          <Box display="flex" flexDirection="column" gap={0.5}>
            <Box display="flex" alignItems="start" gap={2} justifyContent="space-between">
              <Box display="flex" alignItems="center" gap={0.5}>
                <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={16} height={16} />
                <Typography fontSize={14} fontWeight={700}>
                  {symbol}
                </Typography>
              </Box>
              <Typography fontSize={14} fontWeight={500}>
                {formatNumber(amount, symbol)}
              </Typography>
            </Box>
            <Box display="flex" alignItems="start" gap={2} justifyContent="space-between" key={symbol}>
              <Typography fontSize={12} color="figma.grey.500"></Typography>
              {valueUSD && (
                <Typography fontSize={12} color="figma.grey.500">
                  ${formatNumber(valueUSD, 'USD')}
                </Typography>
              )}
            </Box>
          </Box>
          {i !== rewards.length - 1 && <Divider flexItem sx={{ mt: 1.7, mb: 1.5 }} />}
        </Box>
      ))}
    </Box>
  );
};

export default React.memo(RewardsTooltip);

import { Box, Typography } from '@mui/material';
import { MarketsBasicOperation, MarketsBasicOptions } from 'contexts/MarketsBasicContext';
import Image from 'next/image';
import React, { FC, useMemo } from 'react';
import daysLeft from 'utils/daysLeft';
import formatNumber from 'utils/formatNumber';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';

type Props = {
  symbol: string;
  operation: MarketsBasicOperation;
  qty: string;
  option: MarketsBasicOptions;
};

const Overview: FC<Props> = ({ symbol, operation, qty, option }) => {
  const rate = useMemo(
    () => (operation === 'borrow' ? option.borrowAPR : option.depositAPR) || 0,
    [operation, option.borrowAPR, option.depositAPR],
  );
  const interest = useMemo(() => parseFloat(qty) * rate, [qty, rate]);
  const total = useMemo(() => parseFloat(qty) + interest, [qty, interest]);

  return (
    <Box
      display="flex"
      flexDirection="column"
      p={2}
      bgcolor="grey.100"
      border="1px solid #E3E5E8"
      borderRadius="8px"
      gap={0.2}
    >
      <Typography variant="cardTitle">{operation === 'borrow' ? 'Your total debt' : 'Your total earnings'}</Typography>
      <Box display="flex" gap={0.5} mb={1}>
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={symbol}
          width="20"
          height="20"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Typography fontWeight={700} fontSize={24}>
          {formatNumber(total, symbol)}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Assets to borrow
        </Typography>
        <Box display="flex" gap={0.3}>
          <Typography fontWeight={700} fontSize={13}>
            {formatNumber(qty, symbol)}
          </Typography>
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={symbol}
            width="12"
            height="12"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Total interest (+{toPercentage(rate)})
        </Typography>
        <Box display="flex" gap={0.3}>
          <Typography fontWeight={700} fontSize={13}>
            {formatNumber(interest, symbol)}
          </Typography>
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={symbol}
            width="12"
            height="12"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Maturity date (In {daysLeft(option.maturity || 0)})
        </Typography>
        <Typography fontWeight={700} fontSize={13}>
          {parseTimestamp(option.maturity || 0)}
        </Typography>
      </Box>
    </Box>
  );
};

export default Overview;

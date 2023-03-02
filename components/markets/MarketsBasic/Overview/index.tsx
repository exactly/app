import { formatFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import { Box, Typography, useMediaQuery, useTheme } from '@mui/material';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import useAccountData from 'hooks/useAccountData';
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
  option: MarketsBasicOption;
};

const Overview: FC<Props> = ({ symbol, operation, qty, option }) => {
  const { penaltyRate } = useAccountData(symbol);
  const rate = useMemo(
    () => (operation === 'borrow' ? option.borrowAPR : option.depositAPR) || 0,
    [operation, option.borrowAPR, option.depositAPR],
  );
  const interest = useMemo(() => parseFloat(qty) * rate, [qty, rate]);
  const total = useMemo(() => parseFloat(qty) + interest, [qty, interest]);
  const { palette, breakpoints } = useTheme();
  const isMobile = useMediaQuery(breakpoints.down('sm'));

  return (
    <Box
      display="flex"
      flexDirection="column"
      p={2}
      bgcolor="grey.100"
      border={`1px solid ${palette.grey[200]}`}
      borderRadius="8px"
      gap={0.2}
    >
      <Typography mb={0.5} variant="cardTitle">
        {operation === 'borrow' ? 'Your total debt' : 'Your total earnings'}
      </Typography>
      <Box display="flex" gap={0.5} mb={1}>
        <Image
          src={`/img/assets/${symbol}.svg`}
          alt={symbol}
          width="20"
          height="20"
          style={{ maxWidth: '100%', height: 'auto' }}
        />
        <Typography
          variant="browserAlign"
          fontWeight={700}
          fontSize={24}
          height={24}
          lineHeight={isMobile ? 1.2 : undefined}
        >
          {formatNumber(total, symbol, true)}
        </Typography>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Assets to be {operation === 'borrow' ? 'borrowed' : 'deposited'}
        </Typography>
        <Box display="flex" gap={0.3} alignItems="center" minWidth={100} justifyContent="right">
          <Typography
            variant="browserAlign"
            fontWeight={700}
            fontSize={14}
            lineHeight={isMobile ? 1.2 : undefined}
            height={14}
          >
            {formatNumber(qty, symbol)}
          </Typography>
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={symbol}
            width="14"
            height="14"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          Total interest fees to {operation === 'borrow' ? 'be paid' : 'receive'} ({toPercentage(rate)} APR)
        </Typography>
        <Box display="flex" gap={0.3} alignItems="center" minWidth={100} justifyContent="right">
          <Typography
            variant="browserAlign"
            fontWeight={700}
            fontSize={14}
            lineHeight={isMobile ? 1.2 : undefined}
            height={14}
          >
            {formatNumber(interest, symbol)}
          </Typography>
          <Image
            src={`/img/assets/${symbol}.svg`}
            alt={symbol}
            width="14"
            height="14"
            style={{ maxWidth: '100%', height: 'auto' }}
          />
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
          {operation === 'borrow' ? 'Loan' : 'Deposit'} maturity date (In {daysLeft(option.maturity || 0)})
        </Typography>
        <Typography fontWeight={700} fontSize={14} noWrap minWidth={100} textAlign="right">
          {parseTimestamp(option.maturity || 0)}
        </Typography>
      </Box>
      {operation === 'borrow' && (
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight={500} fontSize={13} color="figma.grey.500">
            Late payment penalty daily rate
          </Typography>
          <Typography fontWeight={700} fontSize={14}>
            {`${toPercentage(parseFloat(formatFixed(penaltyRate || Zero, 18)) * 86_400)}`}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(Overview);

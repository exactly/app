import { formatFixed } from '@ethersproject/bignumber';
import { Zero } from '@ethersproject/constants';
import { Box, Skeleton, Typography, useTheme } from '@mui/material';
import { MarketsBasicOperation, MarketsBasicOption } from 'contexts/MarketsBasicContext';
import useAccountData from 'hooks/useAccountData';
import Image from 'next/image';
import React, { FC, useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import daysLeft from 'utils/daysLeft';
import formatNumber from 'utils/formatNumber';
import useTranslateOperation from 'hooks/useTranslateOperation';

import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';

type Props = {
  symbol: string;
  operation: MarketsBasicOperation;
  qty: string;
  option: MarketsBasicOption;
};

const Overview: FC<Props> = ({ symbol, operation, qty, option }) => {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { marketAccount } = useAccountData(symbol);
  const rate = useMemo(
    () => (operation === 'borrow' ? option.borrowAPR : option.depositAPR) || 0,
    [operation, option.borrowAPR, option.depositAPR],
  );

  const { palette } = useTheme();

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
        {operation === 'borrow' ? t('Your total debt') : t('Your total earnings')}
      </Typography>
      <Box display="flex" gap={0.5} mb={1}>
        {option.finalAssets && marketAccount ? (
          <>
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={symbol}
              width="20"
              height="20"
              style={{ maxWidth: '100%', height: 'auto' }}
            />
            <Typography fontWeight={700} fontSize={24}>
              {formatNumber(formatFixed(option.finalAssets, marketAccount.decimals), symbol, true)}
            </Typography>
          </>
        ) : (
          <Skeleton width={100} height={40} />
        )}
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
          {t('Assets to be {{action}}', { action: translateOperation(operation, { variant: 'past' }) })}
        </Typography>
        <Box display="flex" gap={0.3} alignItems="center" minWidth={100} justifyContent="right">
          <Typography fontWeight={700} fontSize={13}>
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
        <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
          {t('Total interest fees to {{action}} ({{rate}} APR)', {
            action: operation === 'borrow' ? t('be paid') : t('receive'),
            rate: toPercentage(rate),
          })}
        </Typography>
        <Box display="flex" gap={0.3} alignItems="center" minWidth={100} justifyContent="right">
          {option.interest && marketAccount ? (
            <>
              <Typography fontWeight={700} fontSize={13}>
                {formatNumber(formatFixed(option.interest, marketAccount.decimals), symbol)}
              </Typography>
              <Image
                src={`/img/assets/${symbol}.svg`}
                alt={symbol}
                width="14"
                height="14"
                style={{ maxWidth: '100%', height: 'auto' }}
              />
            </>
          ) : (
            <Skeleton width={50} height={20} />
          )}
        </Box>
      </Box>
      <Box display="flex" justifyContent="space-between">
        <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
          {t('{{operation}} maturity date (In {{daysLeft}})', {
            operation: translateOperation(operation, { variant: 'noun', capitalize: true }),
            daysLeft: daysLeft(option.maturity || 0),
          })}
        </Typography>
        <Typography fontWeight={700} fontSize={13} noWrap minWidth={100} textAlign="right">
          {parseTimestamp(option.maturity || 0)}
        </Typography>
      </Box>
      {operation === 'borrow' && (
        <Box display="flex" justifyContent="space-between">
          <Typography fontWeight={500} fontSize={12} color="figma.grey.500">
            {t('Late payment penalty daily rate')}
          </Typography>
          <Typography fontWeight={700} fontSize={13}>
            {toPercentage(parseFloat(formatFixed(marketAccount?.penaltyRate || Zero, 18)) * 86_400)}
          </Typography>
        </Box>
      )}
    </Box>
  );
};

export default React.memo(Overview);

import React, { useCallback, useEffect, useMemo, useState } from 'react';
import Image from 'next/image';
import {
  Table,
  TableBody,
  TableCell,
  type TableCellProps,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
  type TypographyProps,
  Box,
  Skeleton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import dayjs from 'dayjs';

import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { PositionTableRow } from '../PositionTable';
import useRewards from 'hooks/useRewards';
import useHealthFactor from 'hooks/useHealthFactor';
import formatNumber from 'utils/formatNumber';
import parseHealthFactor from 'utils/parseHealthFactor';
import useDelayedEffect from 'hooks/useDelayedEffect';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';

type Row = {
  key: string;
  label: React.ReactNode | string | null;
  current: React.ReactNode;
  new?: React.ReactNode;
};

type Props = {
  from: PositionTableRow;
  to?: PositionTableRow;
  percent: number;
};

function Overview({ from, to, percent }: Props) {
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const { marketAccount } = useAccountData(from.symbol);
  const { rates } = useRewards();
  const healthFactor = useHealthFactor();
  const previewer = usePreviewer();

  const rows = useMemo<Row[]>(() => {
    if (!walletAddress || !marketAccount || !healthFactor || !from.balance || !previewer) {
      return [];
    }

    const { decimals, usdPrice, adjustFactor } = marketAccount;

    const isFromFixed = Boolean(from.maturity);
    const isToFixed = Boolean(to?.maturity);

    const rewardsFrom = rates[from.symbol];
    const rewardsTo = to ? rates[to.symbol] : null;

    const wad = BigNumber.from(10n ** BigInt(decimals));

    const originalDebt = from.balance.mul(percent).div(100);
    const previousBorrowDebt = originalDebt.mul(usdPrice).div(wad).mul(WeiPerEther).div(adjustFactor);
    const futureBorrowDebt = (to && isToFixed ? to.balance ?? Zero : originalDebt)
      .mul(usdPrice)
      .div(wad)
      .mul(WeiPerEther)
      .div(adjustFactor);

    const newHF = to
      ? parseHealthFactor(healthFactor.debt.sub(previousBorrowDebt).add(futureBorrowDebt), healthFactor.collateral)
      : null;

    return [
      {
        key: 'PositionType',
        label: t('Position type'),
        current: <TextValue>{isFromFixed ? t('Fixed') : t('Unlimited')}</TextValue>,
        new: to ? <TextValue>{isToFixed ? t('Fixed') : t('Unlimited')}</TextValue> : null,
      },
      {
        key: 'APR',
        label: t('APR'),
        current: <TextValue>{toPercentage(Number(from.apr) / 1e18)}</TextValue>,
        new: to ? <TextValue>{toPercentage(Number(to.apr) / 1e18)}</TextValue> : null,
      },
      ...(rewardsFrom.length
        ? [
            {
              key: 'RewardsAPR',
              label: t('Rewards APR'),
              current: rewardsFrom.map((reward) => (
                <CurrencyTextValue key={reward.assetSymbol} assetSymbol={reward.assetSymbol}>
                  {toPercentage(Number(reward.borrow) / 1e18)}
                </CurrencyTextValue>
              )),
              new: rewardsTo
                ? rewardsTo.map((reward) => (
                    <CurrencyTextValue key={reward.assetSymbol} assetSymbol={reward.assetSymbol}>
                      {toPercentage(Number(reward.borrow) / 1e18)}
                    </CurrencyTextValue>
                  ))
                : null,
            },
          ]
        : []),
      {
        key: 'HealthFactor',
        label: t('Health factor'),
        current: <TextValue>{parseHealthFactor(healthFactor.debt, healthFactor.collateral)}</TextValue>,
        new: newHF ? <TextValue sx={{ color: newHF.startsWith('0') ? 'red' : undefined }}>{newHF}</TextValue> : null,
      },
      {
        key: 'TotalBorrowAmount',
        label: t('Total borrow amount'),
        current: from.balance && (
          <CurrencyTextValue assetSymbol={from.symbol}>
            {formatNumber(formatFixed(from.balance.mul(percent).div(100), from.decimals), from.symbol)}
          </CurrencyTextValue>
        ),
        new: to && to?.balance && (
          <CurrencyTextValue assetSymbol={to.symbol}>
            {formatNumber(formatFixed(to.balance, to.decimals), to.symbol)}
          </CurrencyTextValue>
        ),
      },
    ];
  }, [walletAddress, marketAccount, from, to, t, rates, healthFactor, percent, previewer]);

  return (
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow sx={{ '& th': { border: 0, p: 0, pb: 2 } }}>
            <HeaderCell colSpan={2}>{t('Current')}</HeaderCell>
            <HeaderCell>{t('New')}</HeaderCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map((row) => (
            <TableRow
              key={row.key}
              sx={{
                '& td, & th, & td:after': { border: 0, p: 0, pb: 1 },
                '&:last-child td, &:last-child th, &:last-child td:after': { pb: 0 },
              }}
            >
              {typeof row.label === 'string' ? <RowHeader>{row.label}</RowHeader> : row.label}
              <ArrowCell>{row.current}</ArrowCell>
              <TableCell align="right" sx={{ minWidth: 96 }}>
                {row.new ? row.new : <TextValue>-</TextValue>}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

function HeaderCell({ children, ...props }: TableCellProps) {
  return (
    <TableCell align="right" {...props}>
      <Typography color="figma.grey.600" fontWeight={700} fontSize={13}>
        {children}
      </Typography>
    </TableCell>
  );
}

function RowHeader({ children, ...props }: TableCellProps) {
  return (
    <TableCell component="th" scope="row" {...props}>
      <Typography color="figma.grey.500" fontWeight={500} fontSize={13}>
        {children}
      </Typography>
    </TableCell>
  );
}

function ArrowCell({ ...props }: TableCellProps) {
  return (
    <TableCell
      align="right"
      sx={{
        position: 'relative',
        minWidth: 96,
        '&:after': {
          fontSize: '14px',
          fontWeight: 600,
          position: 'absolute',
          color: 'blue',
          content: '"->"',
          right: -20,
          top: '50%',
          transform: 'translateY(-55%)',
        },
      }}
      {...props}
    />
  );
}

function TextValue({ ...props }: TypographyProps) {
  return <Typography fontWeight={700} fontSize={14} color="grey.900" {...props} />;
}

function CurrencyTextValue({
  assetSymbol,
  children,
}: React.ComponentProps<typeof TextValue> & { assetSymbol: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
      <TextValue>{children}</TextValue>
      <Image src={`/img/assets/${assetSymbol}.svg`} alt={assetSymbol} width={14} height={14} />
    </Box>
  );
}

export default React.memo(Overview);

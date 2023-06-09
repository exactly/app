import React, { useCallback, useMemo, useState } from 'react';
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
  IconButton,
} from '@mui/material';
import { useTranslation } from 'react-i18next';

import AddIcon from '@mui/icons-material/Add';
import ClearIcon from '@mui/icons-material/Clear';

import useAccountData from 'hooks/useAccountData';
import { toPercentage } from 'utils/utils';
import { PositionTableRow } from '../PositionTable';
import useRewards from 'hooks/useRewards';
import useHealthFactor from 'hooks/useHealthFactor';
import formatNumber from 'utils/formatNumber';
import parseHealthFactor from 'utils/parseHealthFactor';
import usePreviewer from 'hooks/usePreviewer';
import { useWeb3 } from 'hooks/useWeb3';
import { WEI_PER_ETHER } from 'utils/const';
import { formatUnits } from 'viem';

type Row = {
  key: string;
  label: React.ReactNode;
  current: React.ReactNode;
  new?: React.ReactNode;
  details?: boolean;
};

type Props = {
  from: PositionTableRow;
  to?: PositionTableRow;
  percent: bigint;
};

function Overview({ from, to, percent }: Props) {
  const { t } = useTranslation();
  const { walletAddress } = useWeb3();
  const { marketAccount } = useAccountData(from.symbol);
  const { rates } = useRewards();
  const healthFactor = useHealthFactor();
  const previewer = usePreviewer();
  const [openDetails, setOpenDetails] = useState(false);

  const open = useCallback(() => setOpenDetails(true), []);
  const close = useCallback(() => setOpenDetails(false), []);

  const rows = useMemo<Row[]>(() => {
    if (!walletAddress || !marketAccount || !healthFactor || !from.balance || !previewer) {
      return [];
    }

    const { decimals, usdPrice, adjustFactor } = marketAccount;

    const isToFixed = Boolean(to?.maturity);

    const rewardsFrom = rates[from.symbol];
    const rewardsTo = to ? rates[to.symbol] : null;

    const wad = 10n ** BigInt(decimals);

    const originalDebt = (from.balance * percent) / 100n;
    const previousBorrowDebt = (((originalDebt * usdPrice) / wad) * WEI_PER_ETHER) / adjustFactor;
    const futureBorrowDebt =
      ((((to && isToFixed ? to.balance ?? 0n : originalDebt) * usdPrice) / wad) * WEI_PER_ETHER) / adjustFactor;

    const newHF = to
      ? parseHealthFactor(healthFactor.debt - previousBorrowDebt + futureBorrowDebt, healthFactor.collateral)
      : null;

    return [
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
        label: t('Health Factor'),
        current: <TextValue>{parseHealthFactor(healthFactor.debt, healthFactor.collateral)}</TextValue>,
        new: newHF ? <TextValue sx={{ color: newHF.startsWith('0') ? 'red' : undefined }}>{newHF}</TextValue> : null,
      },
      {
        key: 'TotalBorrowAmount',
        label: (
          <RowHeader>
            {t('Total borrow amount')}
            {isToFixed && (
              <IconButton
                sx={{
                  borderRadius: '2px',
                  width: '16px',
                  height: '16px',
                  p: '2px',
                  ml: 0.5,
                  backgroundColor: 'figma.grey.100',
                }}
                onClick={openDetails ? close : open}
              >
                {openDetails ? <ClearIcon sx={{ fontSize: 16 }} /> : <AddIcon sx={{ fontSize: 16 }} />}
              </IconButton>
            )}
          </RowHeader>
        ),
        current: from.balance ? (
          <CurrencyTextValue assetSymbol={from.symbol}>
            {formatNumber(formatUnits((from.balance * percent) / 100n, from.decimals), from.symbol)}
          </CurrencyTextValue>
        ) : null,
        new: to && (
          <CurrencyTextValue assetSymbol={to.symbol}>
            {formatNumber(formatUnits(to.balance ? to.balance : originalDebt, to.decimals), to.symbol)}
          </CurrencyTextValue>
        ),
      },
      ...(isToFixed && openDetails
        ? [
            {
              key: 'Value',
              label: <RowHeader>{t('Value')}:</RowHeader>,
              details: true,
              current: from.balance ? (
                <CurrencyTextValue assetSymbol={from.symbol} details>
                  {formatNumber(formatUnits((from.balance * percent) / 100n, from.decimals), from.symbol)}
                </CurrencyTextValue>
              ) : null,
              new:
                to && to.balance && to.balance > 0n ? (
                  <CurrencyTextValue assetSymbol={to.symbol} details>
                    {formatNumber(formatUnits(to.balance - (to.fee ?? 0n), to.decimals), to.symbol)}
                  </CurrencyTextValue>
                ) : null,
            },

            {
              key: 'NewFee',
              label: <RowHeader>{t('New fee')}:</RowHeader>,
              details: true,
              current: <TextValue details>{t('N/A')}</TextValue>,
              new:
                to && to.fee ? (
                  <CurrencyTextValue assetSymbol={to.symbol} details>
                    {formatNumber(formatUnits(to.fee, to.decimals), to.symbol)}
                  </CurrencyTextValue>
                ) : null,
            },
          ]
        : []),
    ];
  }, [walletAddress, marketAccount, from, to, t, rates, healthFactor, percent, previewer, openDetails, open, close]);

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
              {row.details ? <TableCell align="right">{row.current}</TableCell> : <ArrowCell>{row.current}</ArrowCell>}
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

function TextValue({ details, ...props }: TypographyProps & { details?: boolean }) {
  return (
    <Typography
      fontWeight={700}
      fontSize={details ? 12 : 14}
      color={details ? 'figma.grey.500' : 'grey.900'}
      {...props}
    />
  );
}

function CurrencyTextValue({
  assetSymbol,
  details,
  children,
}: React.ComponentProps<typeof TextValue> & { assetSymbol: string; details?: boolean }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
      <TextValue details={details}>{children}</TextValue>
      <Image src={`/img/assets/${assetSymbol}.svg`} alt={assetSymbol} width={14} height={14} />
    </Box>
  );
}

export default React.memo(Overview);

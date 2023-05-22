import React, { useCallback, useEffect, useState } from 'react';
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
} from '@mui/material';
import { useTranslation } from 'react-i18next';
import { WeiPerEther, Zero } from '@ethersproject/constants';
import { formatFixed } from '@ethersproject/bignumber';
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

  // const preview = useCallback(
  //   async (cancelled: () => boolean) => {
  //     if (!date || !walletAddress || !previewerContract || !marketAccount || !qty || totalPositionAssets.isZero())
  //       return;

  //     const pool = marketAccount.fixedBorrowPositions.find(({ maturity }) => maturity.toNumber() === date);
  //     if (!pool) return;

  //     const userInput = parseFixed(qty, marketAccount.decimals);
  //     const positionAssets = userInput.gte(totalPositionAssets) ? totalPositionAssets : userInput;

  //     const { assets } = await previewerContract.previewRepayAtMaturity(
  //       marketAccount.market,
  //       date,
  //       positionAssets,
  //       walletAddress ?? AddressZero,
  //     );
  //     const feeAtMaturity = (positionAssets > pool.position.principal ? pool.position.principal : positionAssets)
  //       .mul(pool.position.fee)
  //       .div(WeiPerEther)
  //       .mul(WeiPerEther)
  //       .div(pool.position.principal);
  //     const principal = positionAssets.sub(feeAtMaturity);
  //     const discount = assets.sub(positionAssets);

  //     if (cancelled()) return;
  //     setPreviewData({
  //       principal: formatNumber(formatFixed(principal, marketAccount.decimals), marketAccount.symbol, true),
  //       amountWithDiscount: formatNumber(formatFixed(assets, marketAccount.decimals), marketAccount.symbol, true),
  //       feeAtMaturity: formatNumber(formatFixed(feeAtMaturity, marketAccount.decimals), marketAccount.symbol, true),
  //       discount: formatNumber(formatFixed(discount, marketAccount.decimals), marketAccount.symbol, true),
  //     });
  //   },
  //   [date, marketAccount, previewerContract, qty, totalPositionAssets, walletAddress],
  // );

  const [rows, setRows] = useState<Row[]>([]);

  const updateRows = useCallback(
    async (cancelled: () => boolean) => {
      if (!walletAddress || !marketAccount || !healthFactor || !from.balance || !previewer) {
        return;
      }

      const { decimals, penaltyRate, adjustFactor } = marketAccount;

      const isFromFixed = Boolean(from.maturity);
      const isToFixed = Boolean(to?.maturity);

      const rewardsFrom = rates[from.symbol];
      const rewardsTo = to ? rates[to.symbol] : null;

      const now = dayjs().unix();
      const isLateRepay = from.maturity ? now > from.maturity : false;
      const penaltyTime = from.maturity ? now - from.maturity : 0;
      const penalties = isLateRepay ? penaltyRate.mul(penaltyTime).mul(from.balance).div(WeiPerEther) : Zero;

      // TODO: Use percentage to calculate amount
      const toRepayAmount = from.balance.mul(percent).div(100);

      // TODO
      const previewBorrowAmount = isToFixed && to?.balance ? to.balance : toRepayAmount;

      // const { assets } =
      //   isFromFixed && from.maturity
      //     ? await previewer.previewRepayAtMaturity(marketAccount.market, from.maturity, borrowAmount, walletAddress)
      //     : { assets: borrowAmount };

      if (cancelled()) return;

      setRows([
        {
          key: 'PositionType',
          label: t('Position type'),
          current: <TextCell>{isFromFixed ? t('Fixed') : t('Unlimited')}</TextCell>,
          new: to ? <TextCell>{isToFixed ? t('Fixed') : t('Unlimited')}</TextCell> : null,
        },
        {
          key: 'APR',
          label: t('APR'),
          current: <TextCell>{toPercentage(Number(from.apr) / 1e18)}</TextCell>,
          new: to ? <TextCell>{toPercentage(Number(to.apr) / 1e18)}</TextCell> : null,
        },
        ...(rewardsFrom.length
          ? [
              {
                key: 'RewardsAPR',
                label: t('Rewards APR'),
                current: rewardsFrom.map((reward) => (
                  <CurrencyCell key={reward.assetSymbol} assetSymbol={reward.assetSymbol}>
                    {toPercentage(Number(reward.borrow) / 1e18)}
                  </CurrencyCell>
                )),
                new: rewardsTo
                  ? rewardsTo.map((reward) => (
                      <CurrencyCell key={reward.assetSymbol} assetSymbol={reward.assetSymbol}>
                        {toPercentage(Number(reward.borrow) / 1e18)}
                      </CurrencyCell>
                    ))
                  : null,
              },
            ]
          : []),
        {
          key: 'HealthFactor',
          label: t('Health factor'),
          current: <TextCell>{parseHealthFactor(healthFactor.debt, healthFactor.collateral)}</TextCell>,
        },
        {
          key: 'TotalBorrowAmount',
          label: t('Total borrow amount'),
          current: from.balance && (
            <CurrencyCell assetSymbol={from.symbol}>
              {formatNumber(formatFixed(from.balance, from.decimals), from.symbol)}
            </CurrencyCell>
          ),
        },
      ]);
    },
    [walletAddress, marketAccount, from, to, t, rates, healthFactor, percent, previewer],
  );

  useDelayedEffect({ effect: updateRows });

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
                {row.new ? row.new : <TextCell>-</TextCell>}
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

function TextCell({ ...props }: TypographyProps) {
  return <Typography fontWeight={700} fontSize={14} color="grey.900" {...props} />;
}

function CurrencyCell({ assetSymbol, children }: React.ComponentProps<typeof TextCell> & { assetSymbol: string }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5, justifyContent: 'flex-end' }}>
      <TextCell>{children}</TextCell>
      <Image src={`/img/assets/${assetSymbol}.svg`} alt={assetSymbol} width={14} height={14} />
    </Box>
  );
}

export default React.memo(Overview);

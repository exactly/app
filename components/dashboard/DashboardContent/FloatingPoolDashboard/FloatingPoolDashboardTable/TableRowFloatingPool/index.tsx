import type { BigNumber } from '@ethersproject/bignumber';
import React, { useContext, useMemo } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { Button, TableRow, TableCell, Stack, Typography, Skeleton } from '@mui/material';

import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import useAccountData from 'hooks/useAccountData';

type Props = {
  symbol: string;
  type: Extract<Operation, 'deposit' | 'borrow'>;
  depositAmount?: BigNumber;
  borrowedAmount?: BigNumber;
  eTokenAmount?: BigNumber;
  market?: string;
};

function TableRowFloatingPool({ symbol, depositAmount, borrowedAmount, eTokenAmount, type, market }: Props) {
  const { decimals, usdPrice } = useAccountData(symbol);
  const { openOperationModal } = useModalStatus();
  const { setMarket } = useContext(MarketContext);
  const { query } = useRouter();

  const rate = useMemo<number | undefined>(() => {
    if (!usdPrice) return;
    return parseFloat(formatFixed(usdPrice, 18));
  }, [usdPrice]);

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
      <Link href={{ pathname: `/assets/${symbol}`, query }}>
        <TableCell component="th" align="left" sx={{ cursor: 'pointer' }} width={240}>
          <Stack direction="row" spacing={1}>
            <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={24} height={24} />
            <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
              {formatSymbol(symbol)}
            </Typography>
          </Stack>
        </TableCell>
      </Link>
      <TableCell align="left" size="small">
        <Typography>
          {(depositAmount &&
            borrowedAmount &&
            rate &&
            `$${formatNumber(
              parseFloat(formatFixed(type === 'deposit' ? depositAmount : borrowedAmount, decimals)) * rate,
              'USD',
              true,
            )}`) || <Skeleton sx={{ margin: 'auto' }} width={40} />}
        </Typography>
      </TableCell>

      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <Typography>
            {(eTokenAmount && `${formatNumber(formatFixed(eTokenAmount, decimals), symbol)}`) || (
              <Skeleton sx={{ margin: 'auto' }} width={40} />
            )}{' '}
          </Typography>
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <SwitchCollateral symbol={symbol} />
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        <Button
          variant="contained"
          onClick={() => {
            market && setMarket({ value: market });
            openOperationModal(type);
          }}
        >
          {type === 'deposit' ? 'Deposit' : 'Borrow'}
        </Button>
      </TableCell>

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        <Button
          variant="outlined"
          sx={{ backgroundColor: 'white' }}
          onClick={() => {
            market && setMarket({ value: market });
            openOperationModal(type === 'deposit' ? 'withdraw' : 'repay');
          }}
        >
          {type === 'deposit' ? 'Withdraw' : 'Repay'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default TableRowFloatingPool;

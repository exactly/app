import type { BigNumber } from '@ethersproject/bignumber';
import React from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import Image from 'next/image';

import { Button, TableRow, TableCell, Stack, Typography, Skeleton } from '@mui/material';

import { Operation } from 'contexts/ModalStatusContext';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import useAccountData from 'hooks/useAccountData';
import useActionButton from 'hooks/useActionButton';
import { useRouter } from 'next/router';

type Props = {
  symbol: string;
  type: Extract<Operation, 'deposit' | 'borrow'>;
  valueUSD?: number;
  depositedAmount?: BigNumber;
  borrowedAmount?: BigNumber;
};

function TableRowFloatingPool({ symbol, valueUSD, depositedAmount, borrowedAmount, type }: Props) {
  const { query } = useRouter();
  const { marketAccount } = useAccountData(symbol);

  const { handleActionClick } = useActionButton();

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
      <Link href={{ pathname: `/${symbol}`, query }} legacyBehavior>
        <TableCell component="th" align="left" sx={{ cursor: 'pointer' }} width={240}>
          <Stack direction="row" spacing={1}>
            <Image
              src={`/img/assets/${symbol}.svg`}
              alt={symbol}
              width={24}
              height={24}
              style={{
                maxWidth: '100%',
                height: 'auto',
              }}
            />
            <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
              {formatSymbol(symbol)}
            </Typography>
          </Stack>
        </TableCell>
      </Link>
      <TableCell align="left" size="small">
        <Typography>
          {(depositedAmount &&
            borrowedAmount &&
            `${formatNumber(
              formatFixed(type === 'deposit' ? depositedAmount : borrowedAmount, marketAccount?.decimals),
              symbol,
            )}`) || <Skeleton width={40} />}{' '}
        </Typography>
      </TableCell>
      <TableCell align="left" size="small">
        <Typography>
          {(valueUSD !== undefined && `$${formatNumber(valueUSD, 'USD', true)}`) || <Skeleton width={70} />}
        </Typography>
      </TableCell>
      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <SwitchCollateral symbol={symbol} />
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        <Button variant="contained" onClick={(e) => handleActionClick(e, type, symbol)}>
          {type === 'deposit' ? 'Deposit' : 'Borrow'}
        </Button>
      </TableCell>

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        <Button
          variant="outlined"
          sx={{ backgroundColor: 'components.bg' }}
          onClick={(e) => handleActionClick(e, type === 'deposit' ? 'withdraw' : 'repay', symbol)}
        >
          {type === 'deposit' ? 'Withdraw' : 'Repay'}
        </Button>
      </TableCell>
    </TableRow>
  );
}

export default TableRowFloatingPool;

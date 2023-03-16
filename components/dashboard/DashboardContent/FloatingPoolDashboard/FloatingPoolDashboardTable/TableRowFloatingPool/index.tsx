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

type Props = {
  symbol: string;
  type: Extract<Operation, 'deposit' | 'borrow'>;
  valueUSD?: number;
  exaTokenAmount?: BigNumber;
};

function TableRowFloatingPool({ symbol, valueUSD, exaTokenAmount, type }: Props) {
  const { decimals } = useAccountData(symbol);

  const { handleActionClick } = useActionButton();

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
      <Link href={`/${symbol}`} legacyBehavior>
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
          {(valueUSD !== undefined && `$${formatNumber(valueUSD, 'USD', true)}`) || <Skeleton width={70} />}
        </Typography>
      </TableCell>

      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <Typography>
            {(exaTokenAmount && `${formatNumber(formatFixed(exaTokenAmount, decimals), symbol)}`) || (
              <Skeleton width={40} />
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

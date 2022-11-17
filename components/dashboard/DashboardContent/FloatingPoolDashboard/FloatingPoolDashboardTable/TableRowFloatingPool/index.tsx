import type { Contract } from '@ethersproject/contracts';
import type { BigNumber } from '@ethersproject/bignumber';
import React, { useContext, useEffect, useState } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import Skeleton from 'react-loading-skeleton';
import Image from 'next/image';

import Button from '@mui/material/Button';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Stack from '@mui/material/Stack';

import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import { Option } from 'react-dropdown';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import { Typography } from '@mui/material';

type Props = {
  symbol: string | undefined;
  depositAmount: BigNumber | undefined;
  borrowedAmount: BigNumber | undefined;
  walletAddress: string | null | undefined;
  eTokenAmount: BigNumber | undefined;
  auditorContract: Contract | undefined;
  type: Option | undefined;
  market: string | undefined;
};

function TableRowFloatingPool({
  symbol,
  depositAmount,
  borrowedAmount,
  walletAddress,
  eTokenAmount,
  auditorContract,
  type,
  market,
}: Props) {
  const { accountData } = useContext(AccountDataContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);
  const { setMarket } = useContext(MarketContext);

  const [rate, setRate] = useState<number | undefined>(undefined);

  useEffect(() => {
    if (accountData) {
      getExchangeRate();
    }
  }, [accountData, walletAddress]);

  function getExchangeRate() {
    if (!accountData || !symbol) return;
    const data = accountData;
    const exchangeRate = parseFloat(formatFixed(data[symbol].usdPrice, 18));
    setRate(exchangeRate);
  }

  return (
    <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
      <Link href={`/assets/${symbol}`}>
        <TableCell component="th" align="left" sx={{ cursor: 'pointer' }}>
          <Stack direction="row" spacing={1}>
            {(symbol && <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={24} height={24} />) || (
              <Skeleton circle height={24} width={24} />
            )}
            <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
              {(symbol && formatSymbol(symbol)) || <Skeleton />}
            </Typography>
          </Stack>
        </TableCell>
      </Link>
      <TableCell align="center" size="small">
        <Typography>
          {(depositAmount &&
            borrowedAmount &&
            symbol &&
            rate &&
            `$${formatNumber(
              parseFloat(
                formatFixed(type?.value === 'deposit' ? depositAmount : borrowedAmount, accountData?.[symbol].decimals),
              ) * rate,
              'USD',
              true,
            )}`) || <Skeleton width={40} />}
        </Typography>
      </TableCell>

      {type?.value === 'deposit' && (
        <TableCell align="center" size="small">
          <Typography>
            {(eTokenAmount &&
              symbol &&
              `${formatNumber(formatFixed(eTokenAmount, accountData?.[symbol].decimals), symbol)}`) || (
              <Skeleton width={40} />
            )}{' '}
          </Typography>
        </TableCell>
      )}

      {type?.value === 'deposit' && (
        <TableCell align="center" size="small">
          <SwitchCollateral symbol={symbol} walletAddress={walletAddress} auditorContract={auditorContract} />
        </TableCell>
      )}

      <TableCell align="center" width={50} size="small">
        {(symbol && type && (
          <Button
            variant="contained"
            onClick={() => {
              setMarket({ value: market! });
              setOperation(type.value as Operation);
              setOpen(true);
            }}
          >
            Deposit
          </Button>
        )) || <Skeleton height={40} />}
      </TableCell>

      <TableCell align="center" width={50} size="small">
        {(symbol && type && (
          <Button
            variant="outlined"
            sx={{ backgroundColor: 'white' }}
            onClick={() => {
              setMarket({ value: market! });
              setOperation(type.value === 'deposit' ? 'withdraw' : 'repay');
              setOpen(true);
            }}
          >
            Borrow
          </Button>
        )) || <Skeleton height={40} />}
      </TableCell>
    </TableRow>
  );
}

export default TableRowFloatingPool;

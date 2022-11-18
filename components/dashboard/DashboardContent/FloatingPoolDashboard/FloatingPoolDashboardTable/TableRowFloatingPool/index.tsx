import type { Contract } from '@ethersproject/contracts';
import type { BigNumber } from '@ethersproject/bignumber';
import React, { useContext, useEffect, useState } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import Image from 'next/image';

import { Button, TableRow, TableCell, Stack, Typography, Skeleton } from '@mui/material';

import AccountDataContext from 'contexts/AccountDataContext';
import ModalStatusContext, { Operation } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import { HealthFactor } from 'types/HealthFactor';

type Props = {
  symbol: string | undefined;
  depositAmount: BigNumber | undefined;
  borrowedAmount: BigNumber | undefined;
  walletAddress: string | null | undefined;
  eTokenAmount: BigNumber | undefined;
  auditorContract: Contract | undefined;
  type: 'deposit' | 'borrow';
  market: string | undefined;
  healthFactor: HealthFactor | undefined;
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
  healthFactor,
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
        <TableCell component="th" align="left" sx={{ cursor: 'pointer' }} width={240}>
          <Stack direction="row" spacing={1}>
            {(symbol && <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width={24} height={24} />) || (
              <Skeleton sx={{ margin: 'auto' }} variant="circular" height={24} width={24} />
            )}
            <Typography fontWeight="600" ml={1} display="inline" alignSelf="center">
              {(symbol && formatSymbol(symbol)) || <Skeleton sx={{ margin: 'auto' }} />}
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
                formatFixed(type === 'deposit' ? depositAmount : borrowedAmount, accountData?.[symbol].decimals),
              ) * rate,
              'USD',
              true,
            )}`) || <Skeleton sx={{ margin: 'auto' }} width={40} />}
        </Typography>
      </TableCell>

      {type === 'deposit' ? (
        <TableCell align="center" size="small">
          <Typography>
            {(eTokenAmount &&
              symbol &&
              `${formatNumber(formatFixed(eTokenAmount, accountData?.[symbol].decimals), symbol)}`) || (
              <Skeleton sx={{ margin: 'auto' }} width={40} />
            )}{' '}
          </Typography>
        </TableCell>
      ) : (
        <TableCell align="center" size="small" />
      )}

      {type === 'deposit' ? (
        <TableCell align="center" size="small">
          <SwitchCollateral
            symbol={symbol}
            walletAddress={walletAddress}
            auditorContract={auditorContract}
            healthFactor={healthFactor}
          />
        </TableCell>
      ) : (
        <TableCell align="center" size="small" />
      )}

      <TableCell align="center" width={50} size="small">
        {(symbol && type && (
          <Button
            variant="contained"
            onClick={() => {
              setMarket({ value: market! });
              setOperation(type as Operation);
              setOpen(true);
            }}
          >
            Deposit
          </Button>
        )) || <Skeleton sx={{ margin: 'auto' }} height={40} />}
      </TableCell>

      <TableCell align="center" width={50} size="small">
        {(symbol && type && (
          <Button
            variant="outlined"
            sx={{ backgroundColor: 'white' }}
            onClick={() => {
              setMarket({ value: market! });
              setOperation(type === 'deposit' ? 'withdraw' : 'repay');
              setOpen(true);
            }}
          >
            Borrow
          </Button>
        )) || <Skeleton sx={{ margin: 'auto' }} height={40} />}
      </TableCell>
    </TableRow>
  );
}

export default TableRowFloatingPool;

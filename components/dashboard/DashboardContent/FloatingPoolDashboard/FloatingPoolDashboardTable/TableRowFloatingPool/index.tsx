import type { BigNumber } from '@ethersproject/bignumber';
import React, { useContext, useEffect, useState } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
import { useRouter } from 'next/router';
import Image from 'next/image';

import { Button, TableRow, TableCell, Stack, Typography, Skeleton } from '@mui/material';

import AccountDataContext from 'contexts/AccountDataContext';
import { Operation, useModalStatus } from 'contexts/ModalStatusContext';
import { MarketContext } from 'contexts/MarketContext';

import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import Link from 'next/link';
import SwitchCollateral from 'components/dashboard/DashboardContent/FloatingPoolDashboard/FloatingPoolDashboardTable/SwitchCollateral';
import { HealthFactor } from 'types/HealthFactor';

type Props = {
  symbol?: string;
  depositAmount?: BigNumber;
  borrowedAmount?: BigNumber;
  walletAddress?: string;
  eTokenAmount?: BigNumber;
  type: Extract<Operation, 'deposit' | 'borrow'>;
  market?: string;
  healthFactor?: HealthFactor;
};

function TableRowFloatingPool({
  symbol,
  depositAmount,
  borrowedAmount,
  walletAddress,
  eTokenAmount,
  type,
  market,
  healthFactor,
}: Props) {
  const { accountData } = useContext(AccountDataContext);
  const { openOperationModal } = useModalStatus();
  const { setMarket } = useContext(MarketContext);
  const { query } = useRouter();

  const [rate, setRate] = useState<number | undefined>();

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
      <Link href={{ pathname: `/assets/${symbol}`, query }}>
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
      <TableCell align="left" size="small">
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
        <TableCell align="left" size="small">
          <Typography>
            {(eTokenAmount &&
              symbol &&
              `${formatNumber(formatFixed(eTokenAmount, accountData?.[symbol].decimals), symbol)}`) || (
              <Skeleton sx={{ margin: 'auto' }} width={40} />
            )}{' '}
          </Typography>
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      {type === 'deposit' ? (
        <TableCell align="left" size="small">
          <SwitchCollateral symbol={symbol} walletAddress={walletAddress} healthFactor={healthFactor} />
        </TableCell>
      ) : (
        <TableCell align="left" size="small" />
      )}

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        {(symbol && type && (
          <Button
            variant="contained"
            onClick={() => {
              setMarket({ value: market! });
              openOperationModal(type);
            }}
          >
            {type === 'deposit' ? 'Deposit' : 'Borrow'}
          </Button>
        )) || <Skeleton sx={{ margin: 'auto' }} height={40} />}
      </TableCell>

      <TableCell align="left" width={50} size="small" sx={{ px: 0.5 }}>
        {(symbol && type && (
          <Button
            variant="outlined"
            sx={{ backgroundColor: 'white' }}
            onClick={() => {
              setMarket({ value: market! });
              openOperationModal(type === 'deposit' ? 'withdraw' : 'repay');
            }}
          >
            {type === 'deposit' ? 'Withdraw' : 'Repay'}
          </Button>
        )) || <Skeleton sx={{ margin: 'auto' }} height={40} />}
      </TableCell>
    </TableRow>
  );
}

export default TableRowFloatingPool;

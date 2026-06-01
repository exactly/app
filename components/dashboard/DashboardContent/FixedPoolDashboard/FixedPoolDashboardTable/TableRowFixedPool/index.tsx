import Image from 'next/image';
import Link from 'next/link';
import { useTranslation } from 'react-i18next';
import KeyboardArrowDownIcon from '@mui/icons-material/KeyboardArrowDown';
import KeyboardArrowUpIcon from '@mui/icons-material/KeyboardArrowUp';
import { Box, Button, ButtonGroup, IconButton, Skeleton, Stack, TableCell, TableRow, Typography } from '@mui/material';
import MaturityLinearProgress from 'components/common/MaturityLinearProgress';
import { Address, formatUnits } from 'viem';
import { useBlockNumber, useContractEvents } from 'wagmi';

import React, { useMemo, useState } from 'react';
import { FixedPoolTransaction } from 'types/FixedPoolTransaction';
import { calculateAPR } from 'utils/calculateAPR';
import formatNumber from 'utils/formatNumber';
import formatSymbol from 'utils/formatSymbol';
import parseTimestamp from 'utils/parseTimestamp';
import CollapseFixedPool from '../CollapseFixedPool';
import useActionButton, { useStartDebtManagerButton } from 'hooks/useActionButton';
import type { Deposit } from 'types/Deposit';
import type { WithdrawMP } from 'types/WithdrawMP';
import type { Borrow } from 'types/Borrow';
import type { Repay } from 'types/Repay';
import usePreviewerExactly from 'hooks/usePreviewerExactly';
import useRouter from 'hooks/useRouter';
import useReadOnly from 'hooks/useReadOnly';
import { marketAbi, marketBlocks } from 'generated/wagmi';
import { defaultChain } from 'utils/client';

type Props = {
  symbol: string;
  valueUSD?: number;
  type: 'deposit' | 'borrow';
  maturityDate: bigint;
  market: Address;
  decimals: number;
};

function TableRowFixedPool({ symbol, valueUSD, type, maturityDate, market, decimals }: Props) {
  const { t } = useTranslation();
  const { query } = useRouter();
  const marketAccount = usePreviewerExactly().data?.find((m) => m.assetSymbol === symbol);
  const { account } = useReadOnly();
  const [open, setOpen] = useState(false);
  const { handleActionClick } = useActionButton();
  const { startDebtManager, isRolloverDisabled } = useStartDebtManagerButton();
  const { data: blockNumber } = useBlockNumber({
    chainId: defaultChain.id,
    watch: open,
    query: { enabled: open },
  });
  const scopeKey = String(blockNumber ?? '');

  const fromBlock = useMemo(
    () =>
      (marketBlocks[defaultChain.id as keyof typeof marketBlocks] as Record<string, bigint> | undefined)?.[
        market.toLowerCase()
      ],
    [market],
  );

  const {
    data: depositTxs = [],
    isLoading: depositTxsLoading,
    isFetching: depositTxsFetching,
  } = useContractEvents({
    address: market,
    abi: marketAbi,
    eventName: 'DepositAtMaturity',
    strict: true,
    args: account ? { maturity: maturityDate, owner: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    scopeKey,
    query: {
      enabled: type === 'deposit' && Boolean(account),
      select: (logs) =>
        logs.map((log): Deposit => {
          const { maturity, assets, fee } = log.args;
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            market: log.address,
            maturity,
            assets,
            fee,
            timestamp: log.blockTimestamp === undefined ? undefined : Number(log.blockTimestamp),
          };
        }),
    },
  });
  const {
    data: withdrawTxs = [],
    isLoading: withdrawTxsLoading,
    isFetching: withdrawTxsFetching,
  } = useContractEvents({
    address: market,
    abi: marketAbi,
    eventName: 'WithdrawAtMaturity',
    strict: true,
    args: { maturity: maturityDate },
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    scopeKey,
    query: {
      enabled: type === 'deposit' && Boolean(account),
      select: (logs) =>
        logs.flatMap((log): WithdrawMP[] => {
          const { maturity, receiver, owner, positionAssets, assets } = log.args;
          if (
            !account ||
            (owner.toLowerCase() !== account.toLowerCase() && receiver.toLowerCase() !== account.toLowerCase())
          ) {
            return [];
          }
          return [
            {
              id: `${log.transactionHash}-${log.logIndex}`,
              market: log.address,
              maturity,
              positionAssets,
              assets,
              timestamp: log.blockTimestamp === undefined ? undefined : Number(log.blockTimestamp),
            },
          ];
        }),
    },
  });
  const {
    data: borrowTxs = [],
    isLoading: borrowTxsLoading,
    isFetching: borrowTxsFetching,
  } = useContractEvents({
    address: market,
    abi: marketAbi,
    eventName: 'BorrowAtMaturity',
    strict: true,
    args: account ? { maturity: maturityDate, borrower: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    scopeKey,
    query: {
      enabled: type === 'borrow' && Boolean(account),
      select: (logs) =>
        logs.map((log): Borrow => {
          const { maturity, assets, fee } = log.args;
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            market: log.address,
            maturity,
            assets,
            fee,
            timestamp: log.blockTimestamp === undefined ? undefined : Number(log.blockTimestamp),
          };
        }),
    },
  });
  const {
    data: repayTxs = [],
    isLoading: repayTxsLoading,
    isFetching: repayTxsFetching,
  } = useContractEvents({
    address: market,
    abi: marketAbi,
    eventName: 'RepayAtMaturity',
    strict: true,
    args: account ? { maturity: maturityDate, borrower: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: defaultChain.id,
    scopeKey,
    query: {
      enabled: type === 'borrow' && Boolean(account),
      select: (logs) =>
        logs.map((log): Repay => {
          const { maturity, assets } = log.args;
          return {
            id: `${log.transactionHash}-${log.logIndex}`,
            market: log.address,
            maturity,
            assets,
            timestamp: log.blockTimestamp === undefined ? undefined : Number(log.blockTimestamp),
          };
        }),
    },
  });

  const exchangeRate: number | undefined = useMemo(() => {
    if (!marketAccount) return;
    return parseFloat(formatUnits(marketAccount.usdPrice, 18));
  }, [marketAccount]);

  const transactions: FixedPoolTransaction[] = useMemo(() => {
    const allTransactions = [
      ...withdrawTxs.map((transaction) => ({ ...transaction, operation: 'withdraw' as const })),
      ...repayTxs.map((transaction) => ({ ...transaction, operation: 'repay' as const })),
      ...depositTxs.map((transaction) => ({ ...transaction, operation: 'deposit' as const })),
      ...borrowTxs.map((transaction) => ({ ...transaction, operation: 'borrow' as const })),
    ].sort((a, b) => (b.timestamp ?? 0) - (a.timestamp ?? 0));

    if (!exchangeRate) return [];
    const transformedTxs = allTransactions.map((transaction) => {
      const assets = formatUnits(transaction.assets, decimals);

      const txType = {
        borrow: t('Borrow'),
        deposit: t('Deposit'),
        repay: t('Repay'),
        withdraw: t('Withdraw'),
      }[transaction.operation];

      const transactionAPR =
        'fee' in transaction && transaction.timestamp !== undefined
          ? calculateAPR(
              transaction.fee,
              transaction.assets,
              BigInt(transaction.timestamp),
              BigInt(transaction.maturity),
            )
          : undefined;

      const isBorrowOrDeposit = transaction.operation === 'borrow' || transaction.operation === 'deposit';
      const date = transaction.timestamp === undefined ? '-' : parseTimestamp(transaction.timestamp);
      const amountUSD = (parseFloat(assets) * exchangeRate).toFixed(2);

      return {
        id: transaction.id,
        operation: transaction.operation,
        type: txType,
        date,
        amount: assets,
        amountUSD,
        isBorrowOrDeposit,
        APR: transactionAPR ? Number(formatUnits(transactionAPR, 18)) : undefined,
      };
    });

    return transformedTxs;
  }, [withdrawTxs, repayTxs, depositTxs, borrowTxs, exchangeRate, decimals, t]);

  const apr = useMemo(() => {
    const txs = type === 'borrow' ? borrowTxs : depositTxs;
    const wad = 10n ** BigInt(decimals);
    let allAPRbyAmount = 0n;
    let allAmounts = 0n;

    txs.forEach(({ fee, assets, timestamp, maturity }) => {
      if (timestamp === undefined) return;
      allAPRbyAmount += (calculateAPR(fee, assets, BigInt(timestamp), maturity) * assets) / wad;
      allAmounts += assets;
    });

    if (allAmounts === 0n) return 0n;

    return (allAPRbyAmount * wad) / allAmounts;
  }, [borrowTxs, depositTxs, decimals, type]);

  const aprLoading =
    type === 'borrow' ? borrowTxsLoading || borrowTxsFetching : depositTxsLoading || depositTxsFetching;

  return (
    <>
      <TableRow
        sx={{ '& > *, & td': { borderBottom: 0 }, backgroundColor: open ? 'grey.100' : 'transparent' }}
        hover
        data-testid={`dashboard-fixed-${type}-row-${maturityDate}-${symbol}`}
      >
        <Link href={{ pathname: `/${symbol}`, query }} legacyBehavior>
          <TableCell component="th" align="left" sx={{ cursor: 'pointer', pl: 1.5 }} width={240}>
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
          {valueUSD !== undefined ? `$${formatNumber(valueUSD, 'USD', true)}` : <Skeleton width={60} />}
        </TableCell>
        <TableCell align="left" size="small">
          {aprLoading ? <Skeleton width={50} /> : `${(Number(formatUnits(apr, 18)) || 0).toFixed(2)} %`}
        </TableCell>
        <TableCell align="left" size="small">
          {maturityDate ? parseTimestamp(maturityDate) : <Skeleton width={80} />}
        </TableCell>
        <TableCell align="left" size="small" width={200}>
          <Box width={150}>
            {maturityDate ? (
              <MaturityLinearProgress maturityDate={maturityDate} operation={type} symbol={symbol} />
            ) : (
              <Skeleton sx={{ margin: 'auto' }} width={150} />
            )}
          </Box>
        </TableCell>
        <TableCell align="left" width={50} size="small" sx={{ px: 1 }}>
          {(maturityDate &&
            (type === 'deposit' ? (
              <Button
                data-testid={`fixed-${maturityDate}-withdraw-${symbol}`}
                variant="outlined"
                onClick={(e) => handleActionClick(e, 'withdrawAtMaturity', symbol, maturityDate)}
                sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap' }}
              >
                {t('Withdraw')}
              </Button>
            ) : (
              <ButtonGroup>
                <Button
                  variant="outlined"
                  sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap', '&:hover': { zIndex: 1 } }}
                  onClick={(e) => handleActionClick(e, 'repayAtMaturity', symbol, maturityDate)}
                  data-testid={`fixed-${maturityDate}-repay-${symbol}`}
                >
                  {t('Repay')}
                </Button>
                <Button
                  variant="outlined"
                  sx={{
                    backgroundColor: 'components.bg',
                    whiteSpace: 'nowrap',
                    '&:disabled': {
                      borderLeftColor: ({ palette }) => palette.grey[palette.mode === 'light' ? 500 : 300],
                    },
                  }}
                  onClick={() => startDebtManager({ from: { symbol, maturity: maturityDate } })}
                  disabled={isRolloverDisabled()}
                  data-testid={`fixed-rollover-${maturityDate}-${symbol}`}
                >
                  {t('Rollover')}
                </Button>
              </ButtonGroup>
            ))) || (
            <Skeleton
              sx={{ margin: 'auto', borderRadius: '32px' }}
              variant="rounded"
              height={34}
              width={type === 'borrow' ? 76 : 96}
            />
          )}
        </TableCell>
        <TableCell align="left" size="small" width={50}>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => setOpen(!open)}
            sx={{ border: '1px solid #E3E5E8', borderRadius: '24px' }}
            data-testid={`dashboard-fixed-${type}-expand-${maturityDate}-${symbol}`}
          >
            {open ? <KeyboardArrowUpIcon /> : <KeyboardArrowDownIcon />}
          </IconButton>
        </TableCell>
      </TableRow>
      <TableRow>
        <TableCell sx={{ py: 0, pr: 1.5 }} colSpan={7} size="small">
          <CollapseFixedPool
            open={open}
            transactions={transactions}
            loading={
              type === 'borrow'
                ? borrowTxsLoading || borrowTxsFetching || repayTxsLoading || repayTxsFetching
                : depositTxsLoading || depositTxsFetching || withdrawTxsLoading || withdrawTxsFetching
            }
          />
        </TableCell>
      </TableRow>
    </>
  );
}

export default TableRowFixedPool;

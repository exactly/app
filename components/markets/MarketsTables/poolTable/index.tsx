import React, { FC, MouseEvent, useCallback, useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Grid from '@mui/material/Grid';
import Button from '@mui/material/Button';
import { Box, Skeleton, Tooltip, useTheme } from '@mui/material';
import LockIcon from '@mui/icons-material/Lock';
import ImportExportIcon from '@mui/icons-material/ImportExport';

import Image from 'next/image';

import parseTimestamp from 'utils/parseTimestamp';
import formatSymbol from 'utils/formatSymbol';

import Link from 'next/link';

import useAssets from 'hooks/useAssets';
import useActionButton from 'hooks/useActionButton';
import useSorting from 'hooks/useSorting';
import TableHeadCell, { TableHeader } from 'components/common/TableHeadCell';
import useRouter from 'hooks/useRouter';
import { useTranslation } from 'react-i18next';
import Rates from 'components/Rates';
import { track } from 'utils/segment';

export type PoolTableProps = {
  isLoading: boolean;
  headers: TableHeader<TableRow>[];
  rows: TableRow[];
};

export type TableRow = {
  symbol: string;
  totalDeposited?: string;
  totalBorrowed?: string;
  depositAPR?: number;
  depositMaturity?: bigint;
  borrowAPR?: number;
  borrowMaturity?: bigint;
  depositedAssets?: string;
  borrowedAssets?: string;
};

const PoolTable: FC<PoolTableProps> = ({ isLoading, headers, rows }) => {
  const { t } = useTranslation();
  const { query } = useRouter();
  const { handleActionClick, isDisable } = useActionButton();
  const assets = useAssets();
  const { palette } = useTheme();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);
  const { setOrderBy, sortData, direction: sortDirection, isActive: sortActive } = useSorting<TableRow>();
  const tempRows = isLoading ? defaultRows : rows;

  const getRateType = useCallback((maturity: bigint | undefined) => {
    if (maturity === undefined) return 'floating';
    return maturity === 0n ? 'floating' : 'fixed';
  }, []);

  const trackRowClick = useCallback((symbol: string) => {
    track('Button Clicked', {
      href: `/${symbol}`,
      name: 'market',
      symbol,
      location: 'Markets',
    });
  }, []);

  const handleDepositClick = useCallback(
    (e: MouseEvent<HTMLButtonElement>, symbol: string, depositMaturity?: bigint): void => {
      const operation = getRateType(depositMaturity) === 'floating' ? 'deposit' : 'depositAtMaturity';
      track('Button Clicked', {
        location: 'Markets',
        name: 'deposit',
        operation,
        symbol,
        maturity: Number(depositMaturity),
      });
      handleActionClick(e, operation, symbol, depositMaturity);
    },
    [getRateType, handleActionClick],
  );
  const handleBorrowClick = (e: MouseEvent<HTMLButtonElement>, symbol: string, borrowMaturity?: bigint): void => {
    const action = getRateType(borrowMaturity) === 'floating' ? 'borrow' : 'borrowAtMaturity';
    track('Button Clicked', {
      location: 'Markets',
      name: 'borrow',
      operation: action,
      symbol,
      maturity: Number(borrowMaturity),
    });
    handleActionClick(e, action, symbol, borrowMaturity);
  };

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map(({ title, tooltipTitle, width, sortKey, sx }) => (
              <TableHeadCell
                key={title.trim()}
                title={title}
                tooltipTitle={tooltipTitle}
                width={width}
                sortActive={sortKey && sortActive(sortKey)}
                sortDirection={sortKey && sortDirection(sortKey)}
                sort={() => setOrderBy(sortKey)}
                isSortEnabled={!!sortKey}
                sx={sx}
              />
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortData(tempRows).map(
            ({
              symbol,
              totalDeposited,
              totalBorrowed,
              depositAPR,
              borrowAPR,
              depositMaturity,
              borrowMaturity,
              depositedAssets,
              borrowedAssets,
            }) => (
              <Link
                href={{ pathname: `/${symbol}`, query }}
                key={symbol}
                rel="noopener noreferrer"
                legacyBehavior
                onClick={() => trackRowClick(symbol)}
              >
                <TableRow
                  key={symbol}
                  sx={{
                    '&:last-child td, &:last-child th': { border: 0 },
                    cursor: 'pointer',
                  }}
                  hover
                  data-testid={`markets-pool-row-${symbol}`}
                >
                  <TableCell component="th" scope="row" sx={{ pr: 3, pl: 1.5 }}>
                    <Grid container alignItems="center">
                      {isLoading ? (
                        <Skeleton variant="circular" width={24} height={24} />
                      ) : (
                        <Image
                          src={`/img/assets/${symbol}.svg`}
                          alt={symbol}
                          width="24"
                          height="24"
                          style={{
                            maxWidth: '100%',
                            height: 'auto',
                          }}
                        />
                      )}
                      <Typography fontWeight="600" ml={1}>
                        {isLoading ? <Skeleton width={60} /> : formatSymbol(symbol)}
                      </Typography>
                    </Grid>
                  </TableCell>
                  <TableCell align="left" sx={{ width: '170px', py: 3, pl: 3, pr: 1.5 }}>
                    <Typography fontWeight={700}>
                      {isLoading ? <Skeleton width={80} /> : `$${totalDeposited}`}
                    </Typography>
                    <Typography variant="subtitle2" color="grey.500">
                      {isLoading ? <Skeleton width={80} /> : `${depositedAssets} ${formatSymbol(symbol)}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ width: '170px', py: 3, px: 1.5 }}>
                    {isLoading || depositAPR === undefined ? (
                      <Skeleton width={110} height={50} />
                    ) : (
                      <Box display="flex" flexDirection="column">
                        <Grid container alignItems="center" gap={1}>
                          <Rates
                            symbol={symbol}
                            apr={depositAPR}
                            type="deposit"
                            rateType={getRateType(depositMaturity)}
                          />
                        </Grid>
                        <Grid container alignItems="center" gap={0.5}>
                          {depositMaturity ? (
                            <LockIcon sx={{ fontSize: 16, color: palette.operation.fixed }} />
                          ) : (
                            <ImportExportIcon sx={{ fontSize: 16, color: palette.operation.variable }} />
                          )}
                          <Typography width="fit-content" variant="subtitle2" color="grey.500">
                            {depositMaturity ? parseTimestamp(depositMaturity) : 'Open-endened'}
                          </Typography>
                        </Grid>
                      </Box>
                    )}
                  </TableCell>
                  <Tooltip
                    title={
                      getRateType(depositMaturity) === 'fixed' &&
                      t(
                        'In order to deposit at a fixed rate, there must have been fixed rate loans at the same maturity previously to ensure the solvency condition',
                      )
                    }
                    arrow
                    placement="top"
                  >
                    <TableCell
                      align="left"
                      size="small"
                      width={50}
                      onClick={(e) => e.preventDefault()}
                      sx={{ cursor: 'default', pl: 1.5, pr: 3, width: '200px' }}
                    >
                      {isLoading ? (
                        <Skeleton sx={{ borderRadius: '32px' }} variant="rounded" height={34} width={80} />
                      ) : (
                        <Button
                          variant="contained"
                          onClick={(e) => handleDepositClick(e, symbol, depositMaturity)}
                          disabled={isDisable(getRateType(depositMaturity), depositAPR)}
                          data-testid={`${getRateType(depositMaturity)}-deposit-${symbol}`}
                          sx={{ whiteSpace: 'nowrap' }}
                        >
                          {t('Deposit')}
                        </Button>
                      )}
                    </TableCell>
                  </Tooltip>
                  <TableCell align="left" sx={{ width: '170px', py: 3, pl: 3, pr: 1.5 }}>
                    <Typography fontWeight={700}>
                      {isLoading ? <Skeleton width={80} /> : `$${totalBorrowed}`}
                    </Typography>
                    <Typography variant="subtitle2" color="grey.500">
                      {isLoading ? <Skeleton width={80} /> : `${borrowedAssets} ${formatSymbol(symbol)}`}
                    </Typography>
                  </TableCell>
                  <TableCell align="left" sx={{ width: '170px', py: 3, px: 1.5 }}>
                    {isLoading || borrowAPR === undefined ? (
                      <Skeleton width={80} />
                    ) : (
                      <Box display="flex" flexDirection="column" width="fit-content">
                        <Grid container alignItems="center" gap={1}>
                          <Rates symbol={symbol} apr={borrowAPR} type="borrow" rateType={getRateType(borrowMaturity)} />
                        </Grid>
                        <Grid container alignItems="center" gap={0.5}>
                          {borrowMaturity ? (
                            <LockIcon sx={{ fontSize: 16, color: palette.operation.fixed }} />
                          ) : (
                            <ImportExportIcon sx={{ fontSize: 16, color: palette.operation.variable }} />
                          )}
                          <Typography width="fit-content" variant="subtitle2" color="grey.500">
                            {borrowMaturity ? parseTimestamp(borrowMaturity) : 'Open-endened'}
                          </Typography>
                        </Grid>
                      </Box>
                    )}
                  </TableCell>
                  <TableCell
                    align="left"
                    size="small"
                    width={50}
                    onClick={(e) => e.preventDefault()}
                    sx={{ cursor: 'default', pl: 1.5, pr: 3, width: 'fit-content' }}
                  >
                    {isLoading ? (
                      <Skeleton
                        sx={{ margin: 'auto', borderRadius: '32px' }}
                        variant="rounded"
                        height={34}
                        width={80}
                      />
                    ) : (
                      <Tooltip
                        title={t(
                          'In order to borrow you need to have a deposit in the Variable Rate Pool marked as collateral in your Dashboard',
                        )}
                        arrow
                        placement="top"
                      >
                        <Button
                          variant="outlined"
                          sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap' }}
                          onClick={(e) => handleBorrowClick(e, symbol, borrowMaturity)}
                          data-testid={`${getRateType(borrowMaturity)}-borrow-${symbol}`}
                        >
                          {t('Borrow')}
                        </Button>
                      </Tooltip>
                    )}
                  </TableCell>
                </TableRow>
              </Link>
            ),
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default PoolTable;

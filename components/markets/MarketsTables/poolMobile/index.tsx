import React, { FC, useCallback, useMemo } from 'react';
import { Box, Button, Grid, Skeleton, SxProps, Tooltip, Typography, useTheme } from '@mui/material';

import useActionButton from 'hooks/useActionButton';
import { PoolTableProps, TableRow } from '../poolTable';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import useAssets from 'hooks/useAssets';
import MobileAssetCard from 'components/MobileAssetCard';
import parseTimestamp from 'utils/parseTimestamp';
import { TableHeader } from 'components/common/TableHeadCell';
import useTranslateOperation from 'hooks/useTranslateOperation';
import Rates from 'components/Rates';
import { track } from 'utils/segment';
import formatSymbol from 'utils/formatSymbol';
import LockIcon from '@mui/icons-material/Lock';
import ImportExportIcon from '@mui/icons-material/ImportExport';

const sxButton: SxProps = {
  whiteSpace: 'nowrap',
  height: '34px',
};

const PoolMobile: FC<PoolTableProps> = ({ isLoading, headers, rows }) => {
  const translateOperation = useTranslateOperation();
  const { handleActionClick, isDisable } = useActionButton();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);
  const tempRows = isLoading ? defaultRows : rows;

  const getRateType = useCallback((maturity: bigint | undefined) => {
    if (maturity === undefined) return 'floating';
    return maturity === 0n ? 'floating' : 'fixed';
  }, []);

  const handleDepositClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, symbol: string, depositMaturity?: bigint) => {
      const operation = getRateType(depositMaturity) === 'floating' ? 'deposit' : 'depositAtMaturity';
      handleActionClick(e, operation, symbol, depositMaturity);
      track('Button Clicked', {
        name: 'deposit',
        location: 'poolMobile',
        symbol,
        maturity: Number(depositMaturity),
        operation,
      });
    },
    [getRateType, handleActionClick],
  );

  const handleBorrowClick = useCallback(
    (e: React.MouseEvent<HTMLButtonElement, MouseEvent>, symbol: string, borrowMaturity?: bigint) => {
      const operation = getRateType(borrowMaturity) === 'floating' ? 'borrow' : 'borrowAtMaturity';

      handleActionClick(e, operation, symbol, borrowMaturity);
      track('Button Clicked', {
        name: 'borrow',
        location: 'poolMobile',
        symbol,
        maturity: Number(borrowMaturity),
        operation,
      });
    },
    [getRateType, handleActionClick],
  );

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={0.5}>
      {tempRows.map(
        (
          {
            symbol,
            totalDeposited,
            totalBorrowed,
            depositAPR,
            borrowAPR,
            depositMaturity,
            borrowMaturity,
            depositedAssets,
            borrowedAssets,
          },
          index,
        ) => (
          <MobileAssetCard
            key={`pool_mobile_${symbol}`}
            symbol={symbol}
            isMarkets
            sx={{ borderRadius: index === 0 ? '6px 6px 0px 0px' : '' }}
          >
            <>
              <Grid container my={0.5}>
                <GridItem
                  symbol={symbol}
                  header={headers[1]}
                  value={`$${totalDeposited}`}
                  isLoading={totalDeposited === undefined}
                  assets={depositedAssets}
                />
                <GridAPRItem
                  symbol={symbol}
                  header={headers[3]}
                  apr={depositAPR}
                  type="deposit"
                  isLoading={depositAPR === undefined}
                  maturity={depositMaturity}
                />
                <Grid item xs={12} my={1.8}>
                  <Button
                    fullWidth
                    variant="contained"
                    sx={sxButton}
                    onClick={(e) => handleDepositClick(e, symbol, depositMaturity)}
                    disabled={isDisable(getRateType(depositMaturity), depositAPR)}
                  >
                    {translateOperation('deposit', { capitalize: true })}
                  </Button>
                </Grid>
                <GridItem
                  symbol={symbol}
                  header={headers[2]}
                  value={`$${totalBorrowed}`}
                  isLoading={totalBorrowed === undefined}
                  assets={borrowedAssets}
                />
                <GridAPRItem
                  symbol={symbol}
                  header={headers[4]}
                  apr={borrowAPR}
                  type="borrow"
                  isLoading={borrowAPR === undefined}
                  maturity={borrowMaturity}
                />
              </Grid>
              <Box display="flex" gap={0.5}>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={sxButton}
                  onClick={(e) => handleBorrowClick(e, symbol, borrowMaturity)}
                >
                  {translateOperation('borrow', { capitalize: true })}
                </Button>
              </Box>
            </>
          </MobileAssetCard>
        ),
      )}
    </Box>
  );
};

const GridAPRItem: FC<{
  symbol: string;
  apr?: number;
  type: 'deposit' | 'borrow';
  header: TableHeader<TableRow>;
  isLoading?: boolean;
  maturity?: bigint;
}> = ({ symbol, apr, type, header, isLoading = false, maturity }) => {
  const { palette } = useTheme();

  return (
    <Grid item xs={6}>
      <Box display="flex" mb={0.5}>
        <Typography fontSize="16px" color="figma.grey.300" lineHeight="20px">
          {header.title}
        </Typography>
        {header.tooltipTitle && (
          <Tooltip title={header.tooltipTitle} placement="top" arrow enterTouchDelay={0}>
            <HelpOutlineIcon sx={{ color: 'figma.grey.300', fontSize: '15px', my: 'auto', ml: '4px' }} />
          </Tooltip>
        )}
      </Box>
      {isLoading ? (
        <Box pt={1}>
          <Skeleton width={60} height={20} />
          <Skeleton width={60} height={20} />
        </Box>
      ) : (
        <>
          <Grid container flexDirection="column" alignItems="start" pt={1} gap={1}>
            <Rates
              symbol={symbol}
              apr={apr}
              type={type}
              rateType={maturity && maturity !== 0n ? 'fixed' : 'floating'}
              directionMobile="row"
            />
            <Grid container alignItems="center" gap={0.5}>
              {maturity ? (
                <LockIcon sx={{ fontSize: 14, color: palette.operation.fixed }} />
              ) : (
                <ImportExportIcon sx={{ fontSize: 14, color: palette.operation.variable }} />
              )}
              <Typography width="fit-content" variant="subtitle2" color="grey.500">
                {maturity ? parseTimestamp(maturity) : 'Open-endened'}
              </Typography>
            </Grid>
          </Grid>
        </>
      )}
    </Grid>
  );
};

const GridItem: FC<{
  symbol: string;
  header: TableHeader<TableRow>;
  value: string;
  isLoading?: boolean;
  assets?: string;
}> = ({ header, value, isLoading = false, assets, symbol }) => (
  <Grid item xs={6}>
    <Box display="flex">
      <Typography fontSize="16px" color="figma.grey.300">
        {header.title}
      </Typography>
      {header.tooltipTitle && (
        <Tooltip title={header.tooltipTitle} placement="top" arrow enterTouchDelay={0}>
          <HelpOutlineIcon sx={{ color: 'figma.grey.300', fontSize: '15px', my: 'auto', ml: '4px' }} />
        </Tooltip>
      )}
    </Box>
    {isLoading ? (
      <>
        <Skeleton width={60} />
        <Skeleton width={60} />
      </>
    ) : (
      <>
        <Grid container flexDirection="column" alignItems="start" justifyContent="center" pt={1} gap={1}>
          <Typography fontSize="16px" fontWeight={700}>
            {value}
          </Typography>
          <Typography variant="subtitle2" color="grey.500">
            {assets} {formatSymbol(symbol)}
          </Typography>
        </Grid>
      </>
    )}
  </Grid>
);

export default PoolMobile;

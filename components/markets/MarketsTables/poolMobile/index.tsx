import React, { FC, useMemo } from 'react';
import { Box, Button, Divider, Grid, Skeleton, Tooltip, Typography } from '@mui/material';

import numbers from 'config/numbers.json';
import useActionButton from 'hooks/useActionButton';
import { toPercentage } from 'utils/utils';
import { PoolTableProps, TableRow } from '../poolTable';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import useAssets from 'hooks/useAssets';
import MobileAssetCard from 'components/MobileAssetCard';
import parseTimestamp from 'utils/parseTimestamp';
import { TableHeader } from 'components/common/TableHeadCell';
import useRewards from 'hooks/useRewards';
import RewardPill from 'components/markets/RewardPill';
import { BigNumber } from '@ethersproject/bignumber';

const { minAPRValue } = numbers;

const PoolMobile: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const { handleActionClick, isDisable } = useActionButton();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);
  const tempRows = isLoading ? defaultRows : rows;
  const isFloating = rateType === 'floating';
  const { rates } = useRewards();

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      {tempRows.map(
        ({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR, depositMaturity, borrowMaturity }) => (
          <MobileAssetCard key={`pool_mobile_${symbol}_${rateType}`} symbol={symbol} isFloating={isFloating}>
            <>
              <Grid container my={0.5}>
                <GridItem header={headers[1]} value={`$${totalDeposited}`} isLoading={totalDeposited === undefined} />
                <GridItem
                  header={headers[3]}
                  value={toPercentage(depositAPR && depositAPR > minAPRValue ? depositAPR : undefined)}
                  rewards={
                    isFloating
                      ? rates[symbol]?.map(({ assetSymbol, floatingDeposit }) => ({
                          assetSymbol,
                          rate: floatingDeposit,
                        }))
                      : undefined
                  }
                  isLoading={depositAPR === undefined}
                  maturity={depositMaturity?.toString()}
                />
                <Grid item xs={12} my={1.8}>
                  <Divider />
                </Grid>
                <GridItem header={headers[2]} value={`$${totalBorrowed}`} isLoading={totalBorrowed === undefined} />
                <GridItem
                  header={headers[4]}
                  value={toPercentage(borrowAPR && borrowAPR > minAPRValue ? borrowAPR : undefined)}
                  rewards={rates[symbol]?.map(({ assetSymbol, borrow }) => ({
                    assetSymbol,
                    rate: borrow,
                  }))}
                  isLoading={borrowAPR === undefined}
                  maturity={borrowMaturity?.toString()}
                />
              </Grid>
              <Box display="flex" gap={0.5}>
                <Button
                  fullWidth
                  variant="contained"
                  sx={{ height: '34px' }}
                  onClick={(e) =>
                    handleActionClick(e, isFloating ? 'deposit' : 'depositAtMaturity', symbol, depositMaturity)
                  }
                  disabled={isDisable(rateType, depositAPR)}
                >
                  Deposit
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={{ height: '34px' }}
                  onClick={(e) =>
                    handleActionClick(e, isFloating ? 'borrow' : 'borrowAtMaturity', symbol, borrowMaturity)
                  }
                >
                  Borrow
                </Button>
              </Box>
            </>
          </MobileAssetCard>
        ),
      )}
    </Box>
  );
};

const GridItem: FC<{
  header: TableHeader<TableRow>;
  value: string;
  rewards?: { assetSymbol: string; rate: BigNumber }[];
  isLoading?: boolean;
  maturity?: string;
}> = ({ header, value, isLoading = false, maturity, rewards }) => (
  <Grid item xs={6}>
    <Box display="flex">
      <Typography fontSize="16px" color="figma.grey.300" lineHeight="20px">
        {header.title}
      </Typography>
      {header.tooltipTitle && (
        <Tooltip title={header.tooltipTitle} placement="top" arrow enterTouchDelay={0}>
          <HelpOutlineIcon sx={{ color: 'figma.grey.300', fontSize: '16px', my: 'auto', ml: '4px' }} />
        </Tooltip>
      )}
    </Box>
    {isLoading ? (
      <Skeleton width={60} />
    ) : (
      <>
        <Grid container alignItems="center" gap={1}>
          <Typography fontSize="16px" fontWeight={700} lineHeight="20px">
            {value}
          </Typography>
          {rewards?.map((r) => (
            <RewardPill key={r.assetSymbol} rate={r.rate} symbol={r.assetSymbol} />
          ))}
        </Grid>

        {maturity && maturity !== '0' && (
          <Typography component="p" width="fit-content" variant="subtitle2" sx={{ color: 'grey.500' }}>
            {parseTimestamp(maturity)}
          </Typography>
        )}
      </>
    )}
  </Grid>
);

export default PoolMobile;

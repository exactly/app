import React, { FC, useMemo } from 'react';
import { Box, Button, Divider, Grid, Tooltip, Typography } from '@mui/material';
import numbers from 'config/numbers.json';
import useActionButton from 'hooks/useActionButton';
import { toPercentage } from 'utils/utils';
import { PoolTableProps, TableHead, TableRow } from '../poolTable';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import useAssets from 'hooks/useAssets';
import MobileAssetCard from 'components/MobileAssetCard';

const { minAPRValue } = numbers;

const PoolMobile: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const { handleActionClick, isDisable } = useActionButton();
  const assets = useAssets();
  const defaultRows = useMemo<TableRow[]>(() => assets.map((s) => ({ symbol: s })), [assets]);
  const tempRows = isLoading ? defaultRows : rows;
  const isFloating = rateType === 'floating';

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      {tempRows.map(
        ({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR, depositMaturity, borrowMaturity }) => (
          <MobileAssetCard key={`pool_mobile_${symbol}_${rateType}`} symbol={symbol} isFloating={isFloating}>
            <>
              <Grid container my={0.5}>
                <GridItem header={headers[1]} value={`$${totalDeposited}`} />
                <GridItem
                  header={headers[3]}
                  value={toPercentage(depositAPR && depositAPR > minAPRValue ? depositAPR : undefined)}
                />
                <Grid xs={12} my={1.8}>
                  <Divider />
                </Grid>
                <GridItem header={headers[2]} value={`$${totalBorrowed}`} />
                <GridItem
                  header={headers[3]}
                  value={toPercentage(borrowAPR && borrowAPR > minAPRValue ? borrowAPR : undefined)}
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

const GridItem: FC<{ header: TableHead; value: string }> = ({ header, value }) => (
  <Grid xs={6}>
    <Box display="flex">
      <Typography fontSize="16px" color="grey.300" lineHeight="20px">
        {header.title}
      </Typography>
      {header.tooltipTitle && (
        <Tooltip title={header.tooltipTitle} placement="top" arrow enterTouchDelay={0}>
          <HelpOutlineIcon sx={{ color: 'grey.300', fontSize: '16px', my: 'auto', ml: '4px' }} />
        </Tooltip>
      )}
    </Box>
    <Typography fontSize="16px" fontWeight={700} lineHeight="20px">
      {value}
    </Typography>
  </Grid>
);

export default PoolMobile;
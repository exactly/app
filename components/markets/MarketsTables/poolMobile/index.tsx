import React, { FC, useMemo } from 'react';
import { Box, Button, Divider, Grid, Skeleton, SxProps, Tooltip, Typography } from '@mui/material';

import useActionButton from 'hooks/useActionButton';
import { PoolTableProps, TableRow } from '../poolTable';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import useAssets from 'hooks/useAssets';
import MobileAssetCard from 'components/MobileAssetCard';
import parseTimestamp from 'utils/parseTimestamp';
import { TableHeader } from 'components/common/TableHeadCell';
import useTranslateOperation from 'hooks/useTranslateOperation';
import Rates from 'components/Rates';

const sxButton: SxProps = {
  whiteSpace: 'nowrap',
  height: '34px',
};

const PoolMobile: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const translateOperation = useTranslateOperation();
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
                <GridItem header={headers[1]} value={`$${totalDeposited}`} isLoading={totalDeposited === undefined} />
                <GridAPRItem
                  symbol={symbol}
                  header={headers[3]}
                  apr={depositAPR}
                  type="deposit"
                  isLoading={depositAPR === undefined}
                  maturity={depositMaturity}
                />
                <Grid item xs={12} my={1.8}>
                  <Divider />
                </Grid>
                <GridItem header={headers[2]} value={`$${totalBorrowed}`} isLoading={totalBorrowed === undefined} />
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
                  fullWidth
                  variant="contained"
                  sx={sxButton}
                  onClick={(e) =>
                    handleActionClick(e, isFloating ? 'deposit' : 'depositAtMaturity', symbol, depositMaturity)
                  }
                  disabled={isDisable(rateType, depositAPR)}
                >
                  {translateOperation('deposit', { capitalize: true })}
                </Button>
                <Button
                  variant="outlined"
                  fullWidth
                  sx={sxButton}
                  onClick={(e) =>
                    handleActionClick(e, isFloating ? 'borrow' : 'borrowAtMaturity', symbol, borrowMaturity)
                  }
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
}> = ({ symbol, apr, type, header, isLoading = false, maturity }) => (
  <Grid item xs={6}>
    <Box display="flex">
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
      <Skeleton width={60} />
    ) : (
      <>
        <Grid container alignItems="center" gap={1}>
          <Rates symbol={symbol} apr={apr} type={type} rateType={maturity && maturity !== 0n ? 'fixed' : 'floating'} />
        </Grid>

        {Boolean(maturity && maturity !== 0n) && (
          <Typography component="p" width="fit-content" variant="subtitle2" sx={{ color: 'grey.500' }}>
            {parseTimestamp(maturity || 0n)}
          </Typography>
        )}
      </>
    )}
  </Grid>
);

const GridItem: FC<{
  header: TableHeader<TableRow>;
  value: string;
  isLoading?: boolean;
}> = ({ header, value, isLoading = false }) => (
  <Grid item xs={6}>
    <Box display="flex">
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
      <Skeleton width={60} />
    ) : (
      <>
        <Grid container alignItems="center" gap={1}>
          <Typography fontSize="16px" fontWeight={700} lineHeight="20px">
            {value}
          </Typography>
        </Grid>
      </>
    )}
  </Grid>
);

export default PoolMobile;

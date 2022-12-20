import React, { FC } from 'react';
import { Box, Button, Divider, Grid, Skeleton, Tooltip, Typography } from '@mui/material';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';
import useMaturityPools, { APRsPerMaturityType } from 'hooks/useMaturityPools';
import numbers from 'config/numbers.json';
import useActionButton from 'hooks/useActionButton';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';

type Props = {
  APRsPerMaturity: APRsPerMaturityType;
  symbol: string;
};

const { minAPRValue } = numbers;

const MaturityPoolsMobile: FC<Props> = ({ APRsPerMaturity, symbol }) => {
  const { handleActionClick } = useActionButton();
  const rows = useMaturityPools(APRsPerMaturity, symbol);

  return (
    <Box width="100%" pb={2}>
      <Typography variant="subtitle2" sx={{ color: 'grey.500' }}>
        Available Pools
      </Typography>
      {rows.map(({ maturity, totalDeposited, totalBorrowed, depositAPR, borrowAPR }) => (
        <Box key={`Maturity_pools_mobile_${symbol}_${maturity}`}>
          <Divider sx={{ my: 1 }} />
          <Box display="flex" flexDirection="column" gap={2} mt={2}>
            <Typography variant="h6">{parseTimestamp(maturity)}</Typography>
            <Grid container>
              <GridItem title="Total Deposits" value={`$${totalDeposited}`} isLoading={totalDeposited === undefined} />
              <GridItem title="Total Borrows" value={`$${totalBorrowed}`} isLoading={totalBorrowed === undefined} />
              <Grid item xs={12} my={0.5} />
              <GridItem
                title="Deposit APR"
                tooltip="The marginal fixed interest rate for a $1 deposit in the Fixed Rated Pool."
                value={`${toPercentage(depositAPR > minAPRValue ? depositAPR : undefined)}`}
                isLoading={depositAPR === undefined}
              />
              <GridItem
                title="Borrow APR"
                tooltip="The marginal fixed interest rate for a $1 borrow in the Fixed Rated Pool."
                value={`${toPercentage(borrowAPR > minAPRValue ? borrowAPR : undefined)}`}
                isLoading={borrowAPR === undefined}
              />
            </Grid>
            <Box display="flex" gap={0.5} mb={2}>
              <Button
                fullWidth
                variant="contained"
                sx={{ height: '34px' }}
                onClick={(e) => handleActionClick(e, 'depositAtMaturity', symbol, parseInt(maturity))}
              >
                Deposit
              </Button>
              <Button
                variant="outlined"
                fullWidth
                sx={{ height: '34px' }}
                onClick={(e) => handleActionClick(e, 'borrowAtMaturity', symbol, parseInt(maturity))}
              >
                Borrow
              </Button>
            </Box>
          </Box>
        </Box>
      ))}
    </Box>
  );
};

const GridItem: FC<{ title: string; value: string; tooltip?: string; isLoading?: boolean }> = ({
  title,
  value,
  tooltip,
  isLoading,
}) => (
  <Grid item xs={6}>
    <Box display="flex">
      <Typography fontSize="16px" color="grey.300" lineHeight="20px">
        {title}
      </Typography>
      {tooltip && (
        <Tooltip title={tooltip} placement="top" arrow enterTouchDelay={0}>
          <HelpOutlineIcon sx={{ color: 'grey.300', fontSize: '16px', my: 'auto', ml: '4px' }} />
        </Tooltip>
      )}
    </Box>
    {isLoading ? (
      <Skeleton width={60} />
    ) : (
      <Typography fontSize="16px" fontWeight={700} lineHeight="20px">
        {value}
      </Typography>
    )}
  </Grid>
);

export default MaturityPoolsMobile;

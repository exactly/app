import React, { FC } from 'react';
import { Box, Button, Divider, Grid, Tooltip, Typography } from '@mui/material';
import numbers from 'config/numbers.json';
import useMarketsPools from 'hooks/useMarketsPools';
import Image from 'next/image';
import { useRouter } from 'next/router';
import getSymbolDescription from 'utils/getSymbolDescription';
import { toPercentage } from 'utils/utils';
import { PoolTableProps, TableHead, TableRow } from '../poolTable';
import Link from 'next/link';
import HelpOutlineIcon from '@mui/icons-material/HelpOutline';

const { minAPRValue } = numbers;

// TODO: replace this with de-hardcoded data
const defaultRows: TableRow[] = [
  { symbol: 'DAI' },
  { symbol: 'USDC' },
  { symbol: 'WETH' },
  { symbol: 'WBTC' },
  { symbol: 'wstETH' },
];

const PoolMobile: FC<PoolTableProps> = ({ isLoading, headers, rows, rateType }) => {
  const { handleActionClick, isDisable } = useMarketsPools();
  const tempRows = isLoading ? defaultRows : rows;
  const { query } = useRouter();
  const isFloating = rateType === 'floating';

  return (
    <Box width="100%" display="flex" flexDirection="column" gap={1}>
      {tempRows.map(
        ({ symbol, totalDeposited, totalBorrowed, depositAPR, borrowAPR, depositMaturity, borrowMaturity }) => (
          <Box
            key={symbol}
            bgcolor="#FFFFFF"
            borderTop={isFloating ? '4px solid #33CC59' : '4px solid #0095FF'}
            boxShadow="0px 4px 12px rgba(175, 177, 182, 0.2)"
            borderRadius="6px"
            padding="16px 16px"
            display="flex"
            flexDirection="column"
            gap={2}
          >
            <Box display="flex" justifyContent="space-between">
              <Link href={{ pathname: `/assets/${symbol}`, query }} key={symbol} rel="noopener noreferrer">
                <Box display="flex" gap={1.3}>
                  <Image src={`/img/assets/${symbol}.svg`} alt={symbol} width="40" height="40" />
                  <Box display="flex" flexDirection="column" my="auto">
                    <Typography fontSize="14px" lineHeight="12px" color="grey.500">
                      {getSymbolDescription(symbol)}
                    </Typography>
                    <Typography variant="h5" lineHeight="24px">
                      {symbol}
                    </Typography>
                  </Box>
                </Box>
              </Link>
              <Typography
                padding="6px 8px"
                variant="subtitle2"
                bgcolor={isFloating ? '#F3FCF5' : '#F3F7FC'}
                color={isFloating ? '#33CC59' : '#0095FF'}
                mb="auto"
              >
                {isFloating ? 'VARIABLE' : 'FIXED'}
              </Typography>
            </Box>
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
          </Box>
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

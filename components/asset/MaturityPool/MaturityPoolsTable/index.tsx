import React, { FC } from 'react';
import Button from '@mui/material/Button';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';
import Tooltip from '@mui/material/Tooltip';

import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';

import numbers from 'config/numbers.json';
import useActionButton from 'hooks/useActionButton';
import useMaturityPools from 'hooks/useMaturityPools';
import { useTheme } from '@mui/material';

type MaturityPoolsTableProps = {
  symbol: string;
};

const HeadCell: FC<{ title: string; tooltipTitle?: string }> = ({ title, tooltipTitle }) => {
  return (
    <TableCell align="left">
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Typography variant="subtitle1" fontSize="10px" color="grey.500" fontWeight={600} textTransform="uppercase">
          {title}
        </Typography>
      </Tooltip>
    </TableCell>
  );
};

const MaturityPoolsTable: FC<MaturityPoolsTableProps> = ({ symbol }) => {
  const { palette } = useTheme();
  const { handleActionClick } = useActionButton();
  const { minAPRValue } = numbers;
  const rows = useMaturityPools(symbol);

  return (
    <TableContainer>
      <Table sx={{ bgcolor: 'transparent' }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <HeadCell title="Maturity" />
            <HeadCell title="Total Deposits" />
            <HeadCell title="Total Borrows" />
            <HeadCell
              title="Deposit APR"
              tooltipTitle="The fixed interest APR for a deposit up to the optimal deposit size."
            />
            <HeadCell
              title="Borrow APR"
              tooltipTitle="The fixed borrowing interest APR at current utilization level."
            />
            <TableCell />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ maturity, totalDeposited, totalBorrowed, depositAPR, borrowAPR }) => (
            <TableRow
              key={maturity}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
              }}
              hover
            >
              <TableCell component="th" scope="row" width={120}>
                <Typography variant="body1" color={palette.mode === 'light' ? 'black' : 'white'} fontWeight={600}>
                  {parseTimestamp(maturity)}
                </Typography>
              </TableCell>
              <TableCell align="left" width={80}>
                ${totalDeposited}
              </TableCell>
              <TableCell align="left" width={75}>
                ${totalBorrowed}
              </TableCell>
              <TableCell align="left" width={65}>
                {toPercentage(depositAPR > minAPRValue ? depositAPR : undefined)}
              </TableCell>
              <TableCell align="left" width={50}>
                {toPercentage(borrowAPR > minAPRValue ? borrowAPR : undefined)}
              </TableCell>
              <TableCell
                align="left"
                size="small"
                width={40}
                onClick={(e) => e.preventDefault()}
                sx={{ cursor: 'default', px: 0.5 }}
              >
                <Button
                  disabled={depositAPR < minAPRValue}
                  variant="contained"
                  onClick={(e) => handleActionClick(e, 'depositAtMaturity', symbol, maturity)}
                >
                  Deposit
                </Button>
              </TableCell>

              <TableCell
                align="left"
                size="small"
                onClick={(e) => e.preventDefault()}
                sx={{ cursor: 'default', px: 0.5 }}
              >
                <Button
                  disabled={borrowAPR < minAPRValue}
                  variant="outlined"
                  sx={{ backgroundColor: 'components.bg' }}
                  onClick={(e) => handleActionClick(e, 'borrowAtMaturity', symbol, maturity)}
                >
                  Borrow
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default MaturityPoolsTable;

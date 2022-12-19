import React, { FC } from 'react';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
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
import useMaturityPools, { APRsPerMaturityType } from 'hooks/useMaturityPools';

type MaturityPoolsTableProps = {
  APRsPerMaturity: APRsPerMaturityType;
  symbol: string;
};

const HeadCell: FC<{ title: string; tooltipTitle?: string }> = ({ title, tooltipTitle }) => {
  return (
    <TableCell align="left">
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Typography variant="subtitle2" sx={{ color: 'grey.500' }} fontWeight={600}>
          {title}
        </Typography>
      </Tooltip>
    </TableCell>
  );
};

const MaturityPoolsTable: FC<MaturityPoolsTableProps> = ({ APRsPerMaturity, symbol }) => {
  const { handleActionClick } = useActionButton();
  const { minAPRValue } = numbers;
  const rows = useMaturityPools(APRsPerMaturity, symbol);

  // TODO: add translations
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650, bgcolor: 'transparent' }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <HeadCell title="Maturity" />
            <HeadCell title="Total Deposits" />
            <HeadCell title="Total Borrows" />
            <HeadCell
              title="Deposit APR"
              tooltipTitle="The marginal fixed interest rate for a $1 deposit in the Fixed Rated Pool."
            />
            <HeadCell
              title="Borrow APR"
              tooltipTitle="The marginal fixed interest rate for a $1 borrow in the Fixed Rated Pool."
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
              <TableCell component="th" scope="row">
                <Typography variant="body1" color="black" fontWeight={600}>
                  {parseTimestamp(maturity)}
                </Typography>
              </TableCell>
              <TableCell align="left">${totalDeposited}</TableCell>
              <TableCell align="left">${totalBorrowed}</TableCell>
              <TableCell align="left">{toPercentage(depositAPR > minAPRValue ? depositAPR : undefined)}</TableCell>
              <TableCell align="left">{toPercentage(borrowAPR > minAPRValue ? borrowAPR : undefined)}</TableCell>
              <TableCell
                align="left"
                size="small"
                width={50}
                onClick={(e) => e.preventDefault()}
                sx={{ cursor: 'default', px: 0.5 }}
              >
                <Button
                  disabled={depositAPR < minAPRValue}
                  variant="contained"
                  onClick={(e) => handleActionClick(e, 'depositAtMaturity', symbol, parseInt(maturity))}
                >
                  Deposit
                </Button>
              </TableCell>

              <TableCell
                align="left"
                size="small"
                width={50}
                onClick={(e) => e.preventDefault()}
                sx={{ cursor: 'default', px: 0.5 }}
              >
                <Button
                  disabled={borrowAPR < minAPRValue}
                  variant="outlined"
                  sx={{ backgroundColor: 'white' }}
                  onClick={(e) => handleActionClick(e, 'borrowAtMaturity', symbol, parseInt(maturity))}
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

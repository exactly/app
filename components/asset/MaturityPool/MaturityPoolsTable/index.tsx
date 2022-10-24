import { FC, useCallback, useContext, useEffect, useState } from 'react';
import { formatUnits } from '@ethersproject/units';
import { WeiPerEther } from '@ethersproject/constants';
import Button from '@mui/material/Button';
import Paper from '@mui/material/Paper';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Typography from '@mui/material/Typography';

import AccountDataContext from 'contexts/AccountDataContext';
import { APRsPerMaturityType } from '../utils';
import formatNumber from 'utils/formatNumber';
import parseTimestamp from 'utils/parseTimestamp';

type MaturityPoolsTableProps = {
  APRsPerMaturity: APRsPerMaturityType;
  symbol: string;
};

type TableRow = {
  maturity: string;
  totalDeposited: string;
  totalBorrowed: string;
  depositAPR: string;
  borrowAPR: string;
};

const HeadCell: FC<{ title: string }> = ({ title }) => {
  return (
    <TableCell align="center">
      <Typography variant="caption" textTransform="uppercase" color="black" fontWeight={600}>
        {title}
      </Typography>
    </TableCell>
  );
};

const MaturityPoolsTable: FC<MaturityPoolsTableProps> = ({ APRsPerMaturity, symbol }) => {
  const { accountData } = useContext(AccountDataContext);
  const [rows, setRows] = useState<TableRow[]>([]);

  const defineRows = useCallback(() => {
    if (!accountData) return;

    const { fixedPools, oraclePrice: exchangeRate } = accountData[symbol];
    const tempRows: TableRow[] = [];

    fixedPools.forEach(({ maturity, borrowed, supplied }, index) => {
      const maturityKey = maturity.toString();

      const totalDeposited = formatNumber(formatUnits(supplied.mul(exchangeRate).div(WeiPerEther)));
      const totalBorrowed = formatNumber(formatUnits(borrowed.mul(exchangeRate).div(WeiPerEther)));
      tempRows.push({
        maturity: maturityKey,
        totalDeposited,
        totalBorrowed,
        depositAPR: (APRsPerMaturity[maturityKey]?.deposit || 'N/A').toString(),
        borrowAPR: (APRsPerMaturity[maturityKey]?.borrow || 'N/A').toString()
      });
    });

    setRows(tempRows);
  }, [accountData, symbol, APRsPerMaturity]);

  useEffect(() => {
    defineRows();
  }, [defineRows]);

  // TODO: add translations
  return (
    <TableContainer component={Paper}>
      <Table sx={{ minWidth: 650 }} aria-label="simple table">
        <TableHead>
          <TableRow>
            <HeadCell title="Maturity" />
            <HeadCell title="Total Deposited" />
            <HeadCell title="Total Borrowed" />
            <HeadCell title="Deposit APR" />
            <HeadCell title="Borrow APR" />
            <TableCell></TableCell>
            <TableCell></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ maturity, totalDeposited, totalBorrowed, depositAPR, borrowAPR }) => (
            <TableRow
              key={maturity}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 }
              }}
            >
              <TableCell component="th" scope="row">
                <Typography variant="body1" color="black" fontWeight={600}>
                  {parseTimestamp(maturity)}
                </Typography>
              </TableCell>
              <TableCell align="center">${totalDeposited}</TableCell>
              <TableCell align="center">${totalBorrowed}</TableCell>
              <TableCell align="center">
                {depositAPR !== 'N/A' ? `${depositAPR}%` : depositAPR}
              </TableCell>
              <TableCell align="center">
                {borrowAPR !== 'N/A' ? `${borrowAPR}%` : borrowAPR}
              </TableCell>
              <TableCell align="center">
                <Button
                  disabled={depositAPR === 'N/A'}
                  variant="contained"
                  //   onClick={() => handleClick('borrowAtMaturity', maturity)}
                >
                  Deposit
                </Button>
              </TableCell>
              <TableCell align="center">
                <Button
                  disabled={borrowAPR === 'N/A'}
                  variant="outlined"
                  sx={{ backgroundColor: 'white' }}
                  //   onClick={() => handleClick('borrowAtMaturity', maturity)}
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

import React, { FC, useCallback, useContext, useEffect, useState } from 'react';
import { formatFixed } from '@ethersproject/bignumber';
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
import Tooltip from '@mui/material/Tooltip';

import formatNumber from 'utils/formatNumber';
import parseTimestamp from 'utils/parseTimestamp';
import { toPercentage } from 'utils/utils';

import AccountDataContext from 'contexts/AccountDataContext';
import { useModalStatus, type Operation } from 'contexts/ModalStatusContext';
import { useWeb3 } from 'hooks/useWeb3';
import { MarketContext } from 'contexts/MarketContext';

import numbers from 'config/numbers.json';

export type APRsPerMaturityType = Record<string, { borrow: number; deposit: number }>;

type MaturityPoolsTableProps = {
  APRsPerMaturity: APRsPerMaturityType;
  symbol: string;
};

type TableRow = {
  maturity: string;
  totalDeposited: string;
  totalBorrowed: string;
  depositAPR: number;
  borrowAPR: number;
};

const HeadCell: FC<{ title: string; tooltipTitle?: string }> = ({ title, tooltipTitle }) => {
  return (
    <TableCell align={title === 'Maturity' ? 'left' : 'center'}>
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Typography variant="subtitle2" sx={{ color: 'grey.500' }} fontWeight={600}>
          {title}
        </Typography>
      </Tooltip>
    </TableCell>
  );
};

const MaturityPoolsTable: FC<MaturityPoolsTableProps> = ({ APRsPerMaturity, symbol }) => {
  const { walletAddress, connect } = useWeb3();
  const { accountData } = useContext(AccountDataContext);
  const { setDate, setMarket } = useContext(MarketContext);
  const { openOperationModal } = useModalStatus();
  const [rows, setRows] = useState<TableRow[]>([]);
  const { minAPRValue } = numbers;

  const defineRows = useCallback(() => {
    if (!accountData) return;

    const { fixedPools, usdPrice: exchangeRate, decimals } = accountData[symbol];
    const tempRows: TableRow[] = [];

    fixedPools.forEach(({ maturity, borrowed, supplied }) => {
      const maturityKey = maturity.toString();

      const totalDeposited = formatNumber(formatFixed(supplied.mul(exchangeRate).div(WeiPerEther), decimals));
      const totalBorrowed = formatNumber(formatFixed(borrowed.mul(exchangeRate).div(WeiPerEther), decimals));

      tempRows.push({
        maturity: maturityKey,
        totalDeposited,
        totalBorrowed,
        depositAPR: APRsPerMaturity[maturityKey]?.deposit,
        borrowAPR: APRsPerMaturity[maturityKey]?.borrow,
      });
    });

    setRows(tempRows);
  }, [accountData, symbol, APRsPerMaturity]);

  useEffect(() => {
    defineRows();
  }, [defineRows]);

  const handleActionClick = (
    action: Extract<Operation, 'borrowAtMaturity' | 'depositAtMaturity'>,
    maturity: string,
  ) => {
    if (!walletAddress && connect) return connect();

    if (!accountData) return;

    const { market } = accountData[symbol];

    setMarket({ value: market });
    setDate({
      value: maturity,
      label: parseTimestamp(maturity),
    });

    openOperationModal(action);
  };

  // TODO: add translations
  return (
    <TableContainer>
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
              <TableCell align="center">${totalDeposited}</TableCell>
              <TableCell align="center">${totalBorrowed}</TableCell>
              <TableCell align="center">{toPercentage(depositAPR > minAPRValue ? depositAPR : undefined)}</TableCell>
              <TableCell align="center">{toPercentage(borrowAPR > minAPRValue ? borrowAPR : undefined)}</TableCell>
              <TableCell
                align="center"
                size="small"
                width={50}
                onClick={(e) => e.preventDefault()}
                sx={{ cursor: 'default' }}
              >
                <Button
                  disabled={depositAPR < minAPRValue}
                  variant="contained"
                  onClick={() => handleActionClick('depositAtMaturity', maturity)}
                >
                  Deposit
                </Button>
              </TableCell>

              <TableCell
                align="center"
                size="small"
                width={50}
                onClick={(e) => e.preventDefault()}
                sx={{ cursor: 'default' }}
              >
                <Button
                  disabled={borrowAPR < minAPRValue}
                  variant="outlined"
                  sx={{ backgroundColor: 'white' }}
                  onClick={() => handleActionClick('borrowAtMaturity', maturity)}
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

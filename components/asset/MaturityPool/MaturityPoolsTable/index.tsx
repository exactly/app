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
import { useTranslation } from 'react-i18next';
import getHourUTC2Local from 'utils/getHourUTC2Local';
import { track } from 'utils/mixpanel';

type MaturityPoolsTableProps = {
  symbol: string;
};

const HeadCell: FC<{ title: string; tooltipTitle?: string }> = ({ title, tooltipTitle }) => {
  return (
    <TableCell align="left" sx={{ '&:first-child': { pl: 1.5 }, '&:last-child': { pr: 1.5 } }}>
      <Tooltip title={tooltipTitle} placement="top" arrow>
        <Typography variant="subtitle1" fontSize="10px" color="grey.500" fontWeight={600} textTransform="uppercase">
          {title}
        </Typography>
      </Tooltip>
    </TableCell>
  );
};

const MaturityPoolsTable: FC<MaturityPoolsTableProps> = ({ symbol }) => {
  const { t } = useTranslation();
  const { handleActionClick } = useActionButton();
  const { minAPRValue } = numbers;
  const rows = useMaturityPools(symbol);

  return (
    <TableContainer>
      <Table sx={{ bgcolor: 'transparent' }}>
        <TableHead>
          <TableRow>
            <HeadCell
              title={t('Maturity')}
              tooltipTitle={t('All fixed pools are due at {{hour}}.', { hour: getHourUTC2Local() })}
            />
            <HeadCell title={t('Deposits')} />
            <HeadCell title={t('Borrows')} />
            <HeadCell
              title={t('Deposit APR')}
              tooltipTitle={t('The fixed interest APR for a deposit up to the optimal deposit size.')}
            />
            <HeadCell
              title={t('Borrow APR')}
              tooltipTitle={t('The fixed borrowing interest APR at current utilization level.')}
            />
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {rows.map(({ maturity, totalDeposited, totalBorrowed, depositAPR, borrowAPR }) => (
            <TableRow
              key={Number(maturity)}
              sx={{
                '&:last-child td, &:last-child th': { border: 0 },
              }}
              hover
            >
              <TableCell component="th" scope="row" width={120} sx={{ pl: 1.5 }}>
                {parseTimestamp(maturity, "MMM DD, 'YY")}
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
              <TableCell align="right" size="small" sx={{ cursor: 'default' }}>
                <Button
                  data-testid={`fixed-${maturity}-deposit-${symbol}`}
                  disabled={depositAPR < minAPRValue}
                  variant="contained"
                  onClick={(e) => {
                    handleActionClick(e, 'depositAtMaturity', symbol, maturity);
                    track('Button Clicked', {
                      name: 'deposit',
                      location: 'Maturity Pools Table',
                      symbol,
                      maturity: Number(maturity),
                    });
                  }}
                  sx={{ whiteSpace: 'nowrap', mr: 0.5 }}
                >
                  {t('Deposit')}
                </Button>
                <Button
                  data-testid={`fixed-${maturity}-borrow-${symbol}`}
                  disabled={borrowAPR < minAPRValue}
                  variant="outlined"
                  sx={{ backgroundColor: 'components.bg', whiteSpace: 'nowrap' }}
                  onClick={(e) => {
                    handleActionClick(e, 'borrowAtMaturity', symbol, maturity);
                    track('Button Clicked', {
                      name: 'borrow',
                      location: 'Maturity Pools Table',
                      symbol,
                      maturity: Number(maturity),
                    });
                  }}
                >
                  {t('Borrow')}
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

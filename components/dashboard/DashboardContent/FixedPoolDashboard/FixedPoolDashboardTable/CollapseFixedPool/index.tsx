import React from 'react';
import {
  Collapse,
  Skeleton,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from '@mui/material';
import { FixedPoolTransaction } from 'types/FixedPoolTransaction';
import { TableHeader } from 'components/common/TableHeadCell';
import { useTranslation } from 'react-i18next';

type Props = {
  open: boolean;
  transactions: FixedPoolTransaction[];
};

function CollapseFixedPool({ open, transactions }: Props) {
  const { t } = useTranslation();
  const headers: TableHeader<FixedPoolTransaction>[] = [
    {
      title: t('Date'),
      align: 'left',
    },
    {
      title: t('Operation'),
      align: 'left',
    },
    {
      title: t('Amount'),
      align: 'left',
    },
    {
      title: t('APR'),
      align: 'left',
    },
  ];
  return (
    <Collapse in={open} timeout="auto" unmountOnExit>
      <Table size="small" aria-label="purchases">
        <TableHead sx={{ backgroundColor: 'grey.200' }}>
          <TableRow>
            {headers.map(({ title, align }) => (
              <TableCell key={`collapse_fixed_pool_header_${title}`} align={align} sx={{ px: 1 }}>
                <Typography variant="subtitle2" sx={{ color: 'grey.600' }} fontWeight={600}>
                  {title}
                </Typography>
              </TableCell>
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {transactions?.map(({ id, date, type, amount, amountUSD, isBorrowOrDeposit, APR }) => (
            <TableRow key={`collapsed_${id}`} sx={{ '&:last-child td, &:last-child th': { border: 0 } }} hover>
              <TableCell component="th" align="left" size="small" sx={{ pl: 1 }}>
                <Typography variant="body2">{date || <Skeleton width={70} />}</Typography>
              </TableCell>
              <TableCell align="left" size="small">
                <Typography variant="body2">
                  {type ? (
                    <>
                      <span style={isBorrowOrDeposit ? { color: `var(--success)` } : { color: `var(--error)` }}>
                        {isBorrowOrDeposit ? '↓' : '↑'}
                      </span>
                      <span style={{ paddingLeft: '2px' }}>{type}</span>
                    </>
                  ) : (
                    <Skeleton width={80} />
                  )}
                </Typography>
              </TableCell>
              <TableCell align="left" size="small">
                <Typography variant="body2">
                  {amount ? (
                    <>
                      {amount}
                      <Tooltip title={t('Calculated with current asset price')} placement="bottom-end">
                        <span style={{ fontSize: '0.9em', color: 'grey', paddingLeft: '4px' }}>(${amountUSD})</span>
                      </Tooltip>
                    </>
                  ) : (
                    <Skeleton width={120} />
                  )}
                </Typography>
              </TableCell>
              <TableCell align="left" size="small">
                {APR !== undefined ? `${(APR || 0).toFixed(2)} %` : '-'}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Collapse>
  );
}

export default CollapseFixedPool;

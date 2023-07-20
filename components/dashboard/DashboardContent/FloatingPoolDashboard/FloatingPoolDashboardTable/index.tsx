import React, { useMemo } from 'react';
import { Table, TableBody, TableContainer, TableHead, TableRow } from '@mui/material';
import { useTranslation } from 'react-i18next';

import { FloatingPoolItemData } from 'types/FloatingPoolItemData';

import TableRowFloatingPool from './TableRowFloatingPool';
import TableHeadCell, { TableHeader } from 'components/common/TableHeadCell';
import useSorting from 'hooks/useSorting';
import useTranslateOperation from 'hooks/useTranslateOperation';

type Props = {
  type: 'deposit' | 'borrow';
  rows: FloatingPoolItemData[];
};

function FloatingPoolDashboardTable({ type, rows }: Props) {
  const { t } = useTranslation();
  const translateOperation = useTranslateOperation();
  const { setOrderBy, sortData, direction: sortDirection, isActive: sortActive } = useSorting<FloatingPoolItemData>();

  const headers: TableHeader<FloatingPoolItemData>[] = useMemo(() => {
    return [
      {
        title: t('Asset'),
        key: 'asset',
        tooltipPlacement: 'top-start',
        align: 'left',
        sortKey: 'symbol',
      },
      {
        title: t(`{{action}} Amount`, { action: translateOperation(type, { capitalize: true, variant: 'past' }) }),
        key: 'tokenAmount',
        tooltipTitle: t(`Amount of tokens {{action}} in the pool`, {
          action: type === 'deposit' ? t('deposited') : t('borrowed'),
        }),
        align: 'left',
      },
      {
        title: t('Value'),
        key: 'value',
        align: 'left',
        sortKey: 'valueUSD',
      },
      {
        title: t('Total APR'),
        key: 'apr',
        align: 'left',
        sortKey: 'apr',
      },
      {
        title: t('Collateral'),
        key: 'collateral',
        hidden: type !== 'deposit',
        align: 'left',
      },
      {
        title: '',
        key: 'deposit',
        align: 'left',
      },
      {
        title: '',
        key: 'borrow',
        align: 'left',
      },
    ];
  }, [translateOperation, type, t]);

  return (
    <TableContainer>
      <Table>
        <TableHead>
          <TableRow>
            {headers.map(({ key, title, align, hidden, tooltipTitle, tooltipPlacement, sortKey }) => (
              <TableHeadCell
                key={`header_${key}_${type}`}
                title={title}
                tooltipTitle={tooltipTitle}
                align={align}
                hidden={hidden}
                tooltipPlacement={tooltipPlacement}
                sortActive={sortKey && sortActive(sortKey)}
                sortDirection={sortKey && sortDirection(sortKey)}
                sort={() => setOrderBy(sortKey)}
                isSortEnabled={!!sortKey}
                sx={{ '&:first-child': { pl: 1.5 }, '&:last-child': { pr: 1.5 } }}
              />
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortData(rows).map(({ symbol, valueUSD, depositedAmount, borrowedAmount, apr }) => (
            <TableRowFloatingPool
              key={`floating_row_${symbol}_${type}`}
              symbol={symbol}
              valueUSD={valueUSD}
              depositedAmount={depositedAmount}
              borrowedAmount={borrowedAmount}
              type={type}
              apr={apr}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(FloatingPoolDashboardTable);

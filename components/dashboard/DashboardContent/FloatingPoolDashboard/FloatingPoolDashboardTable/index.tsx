import React, { useMemo } from 'react';
import { Table, TableBody, TableContainer, TableHead, TableRow } from '@mui/material';

import { FloatingPoolItemData } from 'types/FloatingPoolItemData';

import TableRowFloatingPool from './TableRowFloatingPool';
import TableHeadCell, { TableHeader } from 'components/common/TableHeadCell';
import useSorting from 'hooks/useSorting';

type Props = {
  type: 'deposit' | 'borrow';
  rows: FloatingPoolItemData[];
};

function FloatingPoolDashboardTable({ type, rows }: Props) {
  const { setOrderBy, sortData, direction: sortDirection, isActive: sortActive } = useSorting<FloatingPoolItemData>();

  const headers: TableHeader<FloatingPoolItemData>[] = useMemo(() => {
    return [
      {
        title: 'Asset',
        key: 'asset',
        tooltipPlacement: 'top-start',
        align: 'left',
        sortKey: 'symbol',
      },
      {
        title: `${type === 'deposit' ? 'Deposited' : 'Borrowed'} Amount`,
        key: 'tokenAmount',
        tooltipTitle: `Amount of tokens ${type === 'deposit' ? 'deposited' : 'borrowed'} in the pool`,
        align: 'left',
      },
      {
        title: 'Value',
        key: 'value',
        align: 'left',
        sortKey: 'valueUSD',
      },
      {
        title: 'Collateral',
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
  }, [type]);

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
              />
            ))}
          </TableRow>
        </TableHead>
        <TableBody>
          {sortData(rows).map(({ symbol, valueUSD, depositedAmount, borrowedAmount }) => (
            <TableRowFloatingPool
              key={`floating_row_${symbol}_${type}`}
              symbol={symbol}
              valueUSD={valueUSD}
              depositedAmount={depositedAmount}
              borrowedAmount={borrowedAmount}
              type={type}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(FloatingPoolDashboardTable);

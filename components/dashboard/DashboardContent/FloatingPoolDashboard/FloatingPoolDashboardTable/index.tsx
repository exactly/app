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
        title: 'Value',
        key: 'value',
        align: 'left',
        sortKey: 'valueUSD',
      },
      {
        title: 'exaToken',
        key: 'exaToken',
        hidden: type !== 'deposit',
        tooltipTitle: 'The Exactly voucher token (ERC-4626) for your deposit in the Variable Rate Pool.',
        align: 'left',
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
          {sortData(rows).map(({ symbol, valueUSD, exaTokens }) => (
            <TableRowFloatingPool
              key={`floating_row_${symbol}_${type}`}
              symbol={symbol}
              valueUSD={valueUSD}
              exaTokenAmount={exaTokens}
              type={type}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(FloatingPoolDashboardTable);

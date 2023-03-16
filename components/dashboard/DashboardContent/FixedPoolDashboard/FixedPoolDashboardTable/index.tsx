import React, { useMemo } from 'react';
import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableRowFixedPool from './TableRowFixedPool';
import { Pool } from 'types/FixedPool';
import TableHeadCell, { TableHeader } from 'components/common/TableHeadCell';
import useSorting from 'hooks/useSorting';

type Props = {
  type: 'deposit' | 'borrow';
  rows: Pool[];
};

function FixedPoolDashboardTable({ type, rows }: Props) {
  const { setOrderBy, sortData, direction: sortDirection, isActive: sortActive } = useSorting<Pool>();
  const headers: TableHeader<Pool>[] = useMemo(() => {
    return [
      {
        title: 'Asset',
        key: 'asset',
        tooltipPlacement: 'top-start',
        align: 'left',
        sortKey: 'symbol',
      },
      {
        title: 'Market value',
        key: 'deposited amount',
        align: 'left',
        sortKey: 'valueUSD',
      },
      {
        title: 'Average Fixed Rate',
        key: 'average fixed rate',
        tooltipTitle: 'Average rate for existing deposits',
        tooltipPlacement: 'top-start',
        align: 'left',
      },
      {
        title: 'Maturity Date',
        key: 'maturity date',
        align: 'left',
        sortKey: 'maturity',
      },
      {
        title: 'Time Elapsed',
        key: 'time elapsed',
        align: 'left',
      },
      {
        title: '',
        key: 'action',
        align: 'left',
      },
      {
        title: '',
        key: 'expandable button',
        hidden: true,
        align: 'left',
      },
    ];
  }, []);

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
          {sortData(rows).map(({ valueUSD, maturity, symbol, market, decimals }) => (
            <TableRowFixedPool
              key={`${symbol}_${maturity}_${valueUSD}`}
              type={type}
              valueUSD={valueUSD}
              maturityDate={maturity}
              symbol={symbol}
              market={market}
              decimals={decimals}
            />
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default React.memo(FixedPoolDashboardTable);

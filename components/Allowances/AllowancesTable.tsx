import React, { memo } from 'react';
import { useTranslation } from 'react-i18next';
import { Table, TableBody, TableCell, TableContainer, TableHead, TableRow } from '@mui/material';
import { type Allowance, type AllowancesState } from 'hooks/useAllowances';
import useSorting from 'hooks/useSorting';
import TableHeadCell from 'components/common/TableHeadCell';
import { TableSkeleton } from './Skeletons';
import RevokeButton from './RevokeButton';
import { allowanceColumns } from '.';

export const AllowancesTable = ({ data, loading, update }: AllowancesState) => {
  const { t } = useTranslation();
  const { setOrderBy, sortData, isActive, direction } = useSorting<Allowance>();
  const sortedAllowances = data ? sortData(data) : undefined;
  return (
    <TableContainer>
      <Table
        sx={{
          td: { px: 4, py: 3 },
          th: { px: 4, py: 2 },
          'tr:last-child td': { border: 0 },
        }}
      >
        <TableHead>
          <TableRow>
            {allowanceColumns().map(({ title, sortKey }) => (
              <TableHeadCell
                key={title.trim()}
                title={title}
                sortActive={isActive(sortKey)}
                sortDirection={direction(sortKey)}
                sort={() => setOrderBy(sortKey)}
                isSortEnabled={!!sortKey}
                sx={{
                  h6: { fontFamily: 'Inter', fontSize: 14, fontWeight: 500 },
                  '&:first-child': { pl: 4 },
                  '&:last-child': { pr: 1.5 },
                }}
              />
            ))}
            <TableCell />
          </TableRow>
        </TableHead>
        <TableBody>
          {loading || !sortedAllowances ? (
            <TableSkeleton />
          ) : sortedAllowances.length > 0 ? (
            sortedAllowances.map((row) => (
              <TableRow key={`${row.spenderAddress}-${row.token}`}>
                {allowanceColumns().map(({ DisplayComponent, sortKey }) => (
                  <TableCell key={sortKey}>
                    <DisplayComponent {...row} />
                  </TableCell>
                ))}
                <TableCell align="right">
                  <RevokeButton {...row} update={update} />
                </TableCell>
              </TableRow>
            ))
          ) : (
            <TableRow>
              <TableCell colSpan={4} align="center">
                {t('No approvals found!')}
              </TableCell>
            </TableRow>
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
};

export default memo(AllowancesTable);

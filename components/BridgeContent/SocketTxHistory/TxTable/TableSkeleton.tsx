import React from 'react';
import { Skeleton, TableCell, TableRow } from '@mui/material';

const CellSkeleton = () => (
  <TableCell sx={{ paddingY: 8 }}>
    <Skeleton width={80} />
    <Skeleton width={80} />
  </TableCell>
);

const RowSkeleton = () => (
  <TableRow
    sx={{
      '&:last-child td, &:last-child th': { border: 0, paddingBottom: 0 },
    }}
  >
    <CellSkeleton />
    <CellSkeleton />
    <CellSkeleton />
    <CellSkeleton />
  </TableRow>
);

const TableSkeleton = () => (
  <>
    <RowSkeleton />
    <RowSkeleton />
    <RowSkeleton />
  </>
);

export default TableSkeleton;

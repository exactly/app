import React from 'react';
import { TableCell, Skeleton, TableRow, Box } from '@mui/material';
import { allowanceColumns } from '.';

const AllowanceSkeleton = () => <Skeleton height={53} />;

export const CellSkeleton = () => (
  <TableCell>
    <AllowanceSkeleton />
  </TableCell>
);

export const TableSkeleton = () =>
  [1, 2, 3].map((i) => (
    <TableRow key={i}>
      {allowanceColumns().map(CellSkeleton)}
      <TableCell />
    </TableRow>
  ));

export const MobileSkeleton = () => (
  <Box px={2} py={4}>
    {allowanceColumns().map(AllowanceSkeleton)}
  </Box>
);

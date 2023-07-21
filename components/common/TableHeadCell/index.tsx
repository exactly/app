import React from 'react';
import { TableCell, TableSortLabel, Tooltip, Typography } from '@mui/material';

export type TableHeader<T> = {
  title: string;
  key?: string;
  width?: string;
  tooltipTitle?: string;
  tooltipPlacement?: 'top' | 'top-start' | 'top-end';
  align?: 'left' | 'inherit' | 'center' | 'right' | 'justify';
  hidden?: boolean;
  sortActive?: boolean;
  sortDirection?: 'asc' | 'desc';
  sort?: () => void;
  isSortEnabled?: boolean;
  sortKey?: keyof T;
  sx?: React.ComponentProps<typeof TableCell>['sx'];
};

export default function TableHeadCell<T>({
  title,
  align,
  hidden,
  tooltipTitle,
  tooltipPlacement,
  width,
  sortActive,
  sortDirection,
  sort,
  isSortEnabled,
  sx,
}: TableHeader<T>) {
  return (
    <TableCell align={align || 'left'} sx={{ minWidth: width, ...sx }}>
      <TableSortLabel active={sortActive} direction={sortDirection} onClick={sort} hideSortIcon={!isSortEnabled}>
        <Tooltip title={hidden ? '' : tooltipTitle} placement={tooltipPlacement || 'top'} arrow>
          <Typography
            variant="subtitle2"
            color="grey.500"
            fontWeight={600}
            width="fit-content"
            sx={{ visibility: hidden ? 'hidden' : '' }}
          >
            {title}
          </Typography>
        </Tooltip>
      </TableSortLabel>
    </TableCell>
  );
}

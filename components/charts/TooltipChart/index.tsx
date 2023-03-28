import React, { ReactNode, useMemo } from 'react';
import { alpha, Box, Typography } from '@mui/material';

type Entry = {
  dataKey: string;
  name: string;
  value: number;
  color: string;
};

type Props = {
  active?: boolean;
  payload?: Entry[];
  label?: Date;
  labelFormatter?: (value: Date | undefined) => ReactNode;
  formatter?: (value: number | undefined) => ReactNode;
  itemSorter?: (a: Entry, b: Entry) => number;
  ignoreKeys?: string[];
  additionalInfo?: ReactNode;
  opacity?: number;
};

function TooltipChart({
  active,
  payload,
  label,
  labelFormatter,
  formatter,
  itemSorter,
  ignoreKeys,
  additionalInfo,
  opacity = 1,
}: Props) {
  const sortedPayload = useMemo(
    () => (itemSorter && payload ? payload.sort(itemSorter) : payload),
    [payload, itemSorter],
  );

  if (!active || !sortedPayload || !sortedPayload.length) return null;

  return (
    <Box
      display="flex"
      flexDirection="column"
      border="1px solid #FFFFFF"
      boxShadow="0px 3px 4px rgba(97, 102, 107, 0.1)"
      bgcolor={(theme) => alpha(theme.palette.components.bg, opacity)}
      p="8px"
    >
      <Typography variant="subtitle2" fontSize="10px" mb={0.5}>
        {labelFormatter ? labelFormatter(label) : JSON.stringify(label)}
      </Typography>
      {sortedPayload
        .filter(({ dataKey }) => !ignoreKeys || !ignoreKeys.includes(dataKey))
        .map(({ dataKey, name, value, color }) => (
          <Typography key={dataKey} variant="h6" fontSize="12px" color={color}>
            {`${name}: ${formatter ? formatter(value) : value}`}
          </Typography>
        ))}
      {additionalInfo}
    </Box>
  );
}

export default TooltipChart;

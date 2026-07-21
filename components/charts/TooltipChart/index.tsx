import React, { ReactNode, useMemo } from 'react';
import { alpha, Box, Typography } from '@mui/material';

export type Entry = {
  dataKey: string;
  name: string;
  value: number;
  color: string;
};

export type TooltipChartProps = {
  active?: boolean;
  payload?: Entry[];
  label?: Date;
  labelFormatter?: (value: Date | undefined) => ReactNode;
  formatter?: (value: number, entry: Entry) => ReactNode;
  formatterName?: (name: string | undefined) => ReactNode;
  sortItems?: (a: Entry, b: Entry) => number;
  ignoreKeys?: string[];
  additionalInfo?: ReactNode;
  additionalInfoPosition?: 'top' | 'bottom';
  opacity?: number;
};

function TooltipChart({
  active,
  payload,
  label,
  labelFormatter,
  formatterName,
  formatter,
  sortItems,
  ignoreKeys,
  additionalInfo,
  opacity = 1,
  additionalInfoPosition = 'bottom',
}: TooltipChartProps) {
  const sortedPayload = useMemo(
    () => (typeof sortItems === 'function' && payload ? [...payload].sort(sortItems) : payload),
    [payload, sortItems],
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
      {additionalInfoPosition === 'top' && additionalInfo}
      {sortedPayload
        .filter(({ dataKey }) => !ignoreKeys || !ignoreKeys.includes(dataKey))
        .map((entry) => (
          <Typography key={entry.dataKey} variant="h6" fontSize="12px" color={entry.color}>
            {`${formatterName ? formatterName(entry.name) : entry.name + ':'} ${
              formatter ? formatter(entry.value, entry) : entry.value
            }`}
          </Typography>
        ))}
      {additionalInfoPosition === 'bottom' && additionalInfo}
    </Box>
  );
}

export default TooltipChart;

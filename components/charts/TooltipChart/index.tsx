import React, { ReactNode } from 'react';
import { Box, Typography } from '@mui/material';

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
};

function TooltipChart({ active, payload, label, labelFormatter, formatter }: Props) {
  if (!active || !payload || !payload.length) return null;

  return (
    <Box
      display="flex"
      flexDirection="column"
      border="1px solid #FFFFFF"
      boxShadow="0px 3px 4px rgba(97, 102, 107, 0.1)"
      bgcolor="white"
      p="8px"
    >
      <Typography variant="subtitle2" fontSize="10px" mb={0.5}>
        {labelFormatter ? labelFormatter(label) : JSON.stringify(label)}
      </Typography>
      {payload.map(({ dataKey, name, value, color }) => (
        <Typography key={dataKey} variant="h6" fontSize="12px" color={color}>
          {`${name}: ${formatter ? formatter(value) : value}`}
        </Typography>
      ))}
    </Box>
  );
}

export default TooltipChart;

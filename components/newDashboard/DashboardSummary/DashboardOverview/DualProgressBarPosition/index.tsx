import React, { FC } from 'react';
import DualProgressBar from 'components/common/DualProgressBar';
import { Box, Typography } from '@mui/material';

interface DualProgressBarPositionProps {
  symbol: string;
}

const DualProgressBarPosition: FC<DualProgressBarPositionProps> = ({ symbol }) => {
  const value1 = 20;
  const value2 = 20;
  return (
    <DualProgressBar
      value1={value1}
      value2={value2}
      tooltip1={<TooltipContent symbol={symbol} type="fixed" />}
      tooltip2={<TooltipContent symbol={symbol} type="variable" />}
    />
  );
};

type TooltipContentProps = {
  symbol: string;
  type: 'fixed' | 'variable';
};

const TooltipContent: FC<TooltipContentProps> = ({ symbol, type }) => {
  return (
    <Box display="flex" flexDirection="column" gap={0.5} alignItems="center">
      <Typography fontWeight={600} fontSize={12} textTransform="uppercase" color={type === 'fixed' ? 'blue' : 'green'}>
        {type}
      </Typography>
      <Typography fontWeight={500} fontSize={13} lineHeight="15.73px" color="grey.700">
        $23K | 1.32 {symbol}
      </Typography>
    </Box>
  );
};

export default DualProgressBarPosition;

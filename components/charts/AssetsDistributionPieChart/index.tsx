import { Box, Typography, useTheme } from '@mui/material';
import React, { FC } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useAssetsComposition from 'hooks/useAssetsComposition';
import TooltipChart from '../TooltipChart';
import formatNumber from 'utils/formatNumber';

type Props = {
  type: 'deposit' | 'borrow';
};

const AssetsDistributionPieChart: FC<Props> = ({ type }) => {
  const { depositsComposition, borrowsComposition } = useAssetsComposition();
  const { palette } = useTheme();

  const style = {
    top: '50%',
    right: 0,
    transform: 'translate(0, -50%)',
    lineHeight: '16px',
    fontSize: '12px',
  };

  type Entry = {
    payload: Record<string, string>;
    dataKey: string;
    name: string;
    value: number;
    color: string;
  };

  type CustomProps = {
    active?: boolean;
    payload?: Entry[];
  };

  const CustomTooltip = (props: CustomProps) => {
    const { active, payload } = props;
    if (!active || !payload || !payload.length) return null;

    return (
      <TooltipChart
        {...props}
        formatter={(value) => `$${formatNumber(value as number, 'USD', true)}`}
        additionalInfo={
          <Typography variant="h6" fontSize="12px" color={palette.mode === 'light' ? 'black' : 'white'}>
            {payload[0].payload.percentage} of your {type === 'deposit' ? 'deposits' : 'borrows'}
          </Typography>
        }
      />
    );
  };

  return (
    <Box display="flex" flexDirection="column">
      <Box>
        <Typography variant="h6" fontSize="14px" textAlign={'center'}>
          {type} distribution
        </Typography>
      </Box>
      <ResponsiveContainer minWidth={'250px'}>
        <PieChart>
          <Pie
            dataKey="usdValue"
            data={type === 'deposit' ? depositsComposition : borrowsComposition}
            innerRadius={20}
            outerRadius={40}
            startAngle={90}
            endAngle={450}
          />
          <Legend iconSize={7} iconType="circle" layout="vertical" verticalAlign="middle" wrapperStyle={style} />
          <Tooltip content={(props) => <CustomTooltip {...(props as CustomProps)} />} />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(AssetsDistributionPieChart);

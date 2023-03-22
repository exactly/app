import { Box, Typography } from '@mui/material';
import React, { FC } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const data02 = [
  { name: 'Group A', value: 2400, fill: 'red' },
  { name: 'Group B', value: 4567, fill: 'blue' },
  { name: 'Group C', value: 1398, fill: 'green' },
  { name: 'Group D', value: 9800, fill: 'yellow' },
  { name: 'Group E', value: 0, fill: 'pink' },
];

const data01 = [
  { name: 'Group A', value: 2400, fill: 'red' },
  { name: 'Group B', value: 4567, fill: 'blue' },
];

type Props = {
  type: 'deposit' | 'borrow';
};

const AssetsDistributionPieChart: FC<Props> = ({ type }) => {
  const style = {
    top: '50%',
    right: 0,
    transform: 'translate(0, -50%)',
    lineHeight: '16px',
    fontSize: '12px',
  };
  return (
    <Box display="flex" flexDirection="column">
      <Box>
        <Typography variant="h6" fontSize="14px" textAlign={'center'}>
          {type} distribution
        </Typography>
      </Box>
      <ResponsiveContainer minHeight={'140px'} minWidth={'250px'}>
        <PieChart>
          <Pie dataKey="value" data={type === 'deposit' ? data01 : data02} innerRadius={20} outerRadius={40} />
          <Legend iconSize={7} iconType="circle" layout="vertical" verticalAlign="middle" wrapperStyle={style} />
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(AssetsDistributionPieChart);

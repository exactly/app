import { Box, Typography } from '@mui/material';
import React, { FC } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import useAssetsComposition from 'hooks/useAssetsComposition';

type Props = {
  type: 'deposit' | 'borrow';
};

const AssetsDistributionPieChart: FC<Props> = ({ type }) => {
  const { depositsComposition, borrowsComposition } = useAssetsComposition();

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
          <Tooltip />
        </PieChart>
      </ResponsiveContainer>
    </Box>
  );
};

export default React.memo(AssetsDistributionPieChart);

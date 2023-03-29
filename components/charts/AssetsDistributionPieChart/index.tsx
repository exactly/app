import { Grid, Typography, useTheme } from '@mui/material';
import React, { FC } from 'react';
import { PieChart, Pie, Tooltip, Legend, ResponsiveContainer, Cell } from 'recharts';
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
    right: -15,
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
        formatter={() => ''}
        formatterName={(name) => (name === 'WETH' ? 'ETH' : name)}
        opacity={0.8}
        additionalInfo={
          <Typography variant="h6" fontSize="12px" color={palette.mode === 'light' ? '#000' : '#fff'}>
            ${formatNumber(payload[0].value as number, 'USD', true)} ({payload[0].payload.percentage})
          </Typography>
        }
      />
    );
  };

  return (
    <Grid item display="flex" flexDirection="column" p={'24px'} minWidth={'200px'} minHeight={'155px'}>
      <Typography variant="h6" fontSize="14px">
        Your {type === 'deposit' ? 'Deposits' : 'Borrows'}
      </Typography>

      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            dataKey="usdValue"
            data={type === 'deposit' ? depositsComposition : borrowsComposition}
            innerRadius={20}
            outerRadius={40}
            cx={40}
            cy={38}
            startAngle={90}
            endAngle={450}
          >
            {depositsComposition &&
              depositsComposition.map((entry, index) => (
                <Cell
                  key={entry.name}
                  fill={palette.colors[index % palette.colors.length]}
                  stroke={palette.colors[index % palette.colors.length]}
                />
              ))}
          </Pie>
          <Legend
            formatter={(value) => (value === 'WETH' ? 'ETH' : value)}
            iconSize={7}
            iconType="circle"
            layout="vertical"
            verticalAlign="middle"
            wrapperStyle={style}
          />
          <Tooltip
            allowEscapeViewBox={{ x: true, y: true }}
            content={(props) => <CustomTooltip {...(props as CustomProps)} />}
            wrapperStyle={{ width: '170px' }}
          />
        </PieChart>
      </ResponsiveContainer>
    </Grid>
  );
};

export default React.memo(AssetsDistributionPieChart);

import { useCallback, useState } from 'react';
import { Cell, Pie, PieChart, Sector } from 'recharts';
import { DonutData } from 'types/DonutData';

type Props = {
  data?: DonutData;
};

function DonutChart({ data }: Props) {
  const [activeIndex, setActiveIndex] = useState(0);
  const onPieEnter = useCallback(
    (_, index) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      midAngle,
      endAngle,
      fill,
      payload
    } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);
    return (
      <g style={{ cursor: 'pointer' }}>
        <text x={cx} y={cy} dy={8} textAnchor="middle">
          {payload.label}
        </text>
        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
        {/* <text
          x={x}
          y={y}
          fill="red"
          textAnchor={'end'}
          dominantBaseline="center"
        >
          a
        </text> */}
      </g>
    );
  };

  const label = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, percent } = props;
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g style={{ cursor: 'pointer' }}>
        <text
          x={x + 40}
          y={y + 40}
          fill="red"
          textAnchor={'end'}
          dominantBaseline="center"
        >
          {`${(percent * 100).toFixed(0)}%`}
        </text>
      </g>
    );
  };

  const defaultData = [
    { label: '$ 1.6b', value: 100 },
    { label: 'Group B', value: 100 },
    { label: 'Group C', value: 100 },
    { label: 'Group D', value: 100 }
  ];

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042'];

  return (
    <PieChart width={150} height={150}>
      <Pie
        activeIndex={activeIndex}
        data={defaultData}
        cx={'50%'}
        cy={'50%'}
        innerRadius={40}
        outerRadius={70}
        dataKey="value"
        onMouseEnter={onPieEnter}
        activeShape={renderActiveShape}
        labelLine={false}
        label={label}
      >
        {defaultData.map((entry, i) => (
          <Cell key={`cell-${i}`} fill={COLORS[i % COLORS.length]} />
        ))}
      </Pie>
    </PieChart>
  );
}

export default DonutChart;

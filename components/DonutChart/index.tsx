import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';

import { DonutData } from 'types/DonutData';

import styles from './style.module.scss';

type Props = {
  data: Array<DonutData>;
  small?: boolean;
  insideValue?: string;
};

type ActiveShape = {
  cx: number;
  cy: number;
  innerRadius: number;
  outerRadius: number;
  startAngle: number;
  endAngle: number;
  fill: string;
};

function DonutChart({ data, small, insideValue }: Props) {
  const renderActiveShape = (props: ActiveShape) => {
    const { cx, cy, innerRadius, outerRadius, startAngle, endAngle, fill } = props;

    return (
      <g className={styles.innerValue}>
        <text x={cx} y={cy - 4} dy={8} textAnchor="middle">
          {insideValue}
        </text>

        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius - 1}
          outerRadius={outerRadius + 1}
          startAngle={startAngle + 0.5}
          endAngle={endAngle - 0.5}
          fill={fill}
        />
      </g>
    );
  };

  return (
    <>
      <ResponsiveContainer width={small ? 100 : 150} height={small ? 100 : 150}>
        <PieChart>
          <Pie
            activeIndex={insideValue ? 0 : -1}
            labelLine={false}
            data={data}
            cx={'50%'}
            cy={'40%'}
            innerRadius={small ? 20 : 40}
            outerRadius={small ? 40 : 60}
            dataKey="value"
            isAnimationActive={false}
            activeShape={renderActiveShape}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} stroke={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </>
  );
}

export default DonutChart;

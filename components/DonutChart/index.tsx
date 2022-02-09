import { useCallback, useState } from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Sector } from 'recharts';

import { DonutData } from 'types/DonutData';

import styles from './style.module.scss';

type Props = {
  data: Array<DonutData>;
  hideValue?: boolean;
};

function DonutChart({ data, hideValue }: Props) {
  const [activeIndex, setActiveIndex] = useState<number>(-1);

  const onPieEnter = useCallback(
    (_, index) => {
      setActiveIndex(index);
    },
    [setActiveIndex]
  );

  const onPieLeave = () => {
    setActiveIndex(-1);
  };

  const renderActiveShape = (props: any) => {
    const {
      cx,
      cy,
      innerRadius,
      outerRadius,
      startAngle,
      endAngle,
      fill,
      payload
    } = props;

    return (
      <g className={styles.pointer}>
        <text x={cx} y={cy - 10} dy={8} textAnchor="middle">
          {payload.label}
        </text>

        {!hideValue && (
          <text x={cx} y={cy + 10} dy={8} textAnchor="middle">
            {payload.value}
          </text>
        )}

        <Sector
          cx={cx}
          cy={cy}
          innerRadius={innerRadius}
          outerRadius={outerRadius}
          startAngle={startAngle}
          endAngle={endAngle}
          fill={fill}
        />
      </g>
    );
  };

  const label = (props: any) => {
    const { cx, cy, midAngle, innerRadius, outerRadius, payload } = props;
    if (!payload.image) {
      return;
    }
    const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
    const RADIAN = Math.PI / 180;
    const x = cx + radius * Math.cos(-midAngle * RADIAN);
    const y = cy + radius * Math.sin(-midAngle * RADIAN);

    return (
      <g className={styles.pointer}>
        <image
          x={x - 10}
          y={y - 10}
          href={payload.image}
          height="22"
          width="22"
        />
      </g>
    );
  };

  return (
    <div className={styles.pieChart} onMouseLeave={onPieLeave}>
      <ResponsiveContainer>
        <PieChart width={150} height={150}>
          <Pie
            labelLine={false}
            label={label}
            activeIndex={activeIndex}
            data={data}
            cx={'50%'}
            cy={'50%'}
            innerRadius={40}
            outerRadius={70}
            dataKey="value"
            onMouseEnter={onPieEnter}
            activeShape={renderActiveShape}
            isAnimationActive={false}
          >
            {data.map((entry, i) => (
              <Cell key={`cell-${i}`} fill={entry.color} stroke={entry.color} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}

export default DonutChart;

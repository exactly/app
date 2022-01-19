import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import styles from './style.module.scss';

function SmartPoolChart() {
  const data = [
    {
      rate: 10,
      apr: 20
    },
    {
      rate: 22,
      apr: 40
    },
    {
      rate: 38,
      apr: 60
    },
    {
      rate: 55,
      apr: 80
    },
    {
      rate: 80,
      apr: 100
    }
  ];

  return (
    <div className={styles.chartContainer}>
      <p className={styles.title}>Interest Rate Model</p>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          width={730}
          height={250}
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <XAxis dataKey="rate" allowDuplicatedCategory={false} />
          <YAxis dataKey="apr" allowDuplicatedCategory={false} />
          <Tooltip />
          <Line type="monotone" dataKey="apr" stroke="#4d4de8" />
          <Line type="monotone" dataKey="rate" stroke="#7bf5e1" />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default SmartPoolChart;

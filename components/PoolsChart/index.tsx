import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ZAxis,
  Legend
} from 'recharts';

function PoolsChart() {
  const deposit = [
    { date: '12-Jan-22', apr: 4, z: 41 },
    { date: '19-Jan-22', apr: 6, z: 100 },
    { date: '26-Jan-22', apr: 8, z: 110 },
    { date: '02-Feb-22', apr: 9, z: 120 },
    { date: '09-Feb-22', apr: 15, z: 200 },
    { date: '16-Feb-22', apr: 20, z: 210 }
  ];

  const borrow = [
    { date: '12-Jan-22', apr: 1, z: 35 },
    { date: '19-Jan-22', apr: 4, z: 50 },
    { date: '26-Jan-22', apr: 6, z: 20 },
    { date: '02-Feb-22', apr: 8, z: 170 },
    { date: '09-Feb-22', apr: 9, z: 200 },
    { date: '16-Feb-22', apr: 15, z: 50 }
  ];

  return (
    <div style={{ width: '100%', height: 350 }}>
      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart
          margin={{
            top: 20,
            right: 20,
            bottom: 20,
            left: 20
          }}
        >
          <XAxis
            dataKey="date"
            name="date"
            interval={0}
            minTickGap={30}
            type="category"
            allowDuplicatedCategory={false}
          />
          <YAxis dataKey="apr" name="APR%" unit="%" />
          <ZAxis type="number" range={[20, 210]} dataKey="z" name="Amount" />
          <Tooltip cursor={{ strokeDasharray: '3 3' }} />
          <Legend verticalAlign="bottom" />
          <Scatter name="Deposit" data={deposit} fill="#4d4de8" line />
          <Scatter name="Borrow" data={borrow} fill="#53d3be" line />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PoolsChart;

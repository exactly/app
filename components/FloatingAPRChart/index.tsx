import { useContext, useEffect, useState } from 'react';

import {
  Line,
  ComposedChart,
  Area,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  Legend,
  CartesianGrid
} from 'recharts';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';
import keys from './translations.json';

import getSubgraph from 'utils/getSubgraph';
import queryRates from 'utils/queryRates';

import { Network } from 'types/Network';
import { LangKeys } from 'types/Lang';

import Button from 'components/common/Button';

interface Props {
  market: string | undefined;
  network: Network | undefined;
}

function FloatingAPRChart({ market, network }: Props) {
  const [data, setData] = useState<any>([]);
  const defaultOptions = {
    maxFuturePools: 3,
    interval: 3_600 * 24,
    count: 30,
    roundTicks: true
  };

  const [queryoptions, setQueryOptions] = useState<Options>(defaultOptions);
  const [queryWindow, setQueryWindow] = useState<string>('1 Month');

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  useEffect(() => {
    getHistoricalAPR();
  }, [market, network, queryoptions]);

  async function getHistoricalAPR() {
    if (!market || !network) return;

    const subgraphUrl = getSubgraph(network.name);

    const data = await queryRates(subgraphUrl, market, 'deposit', queryoptions);

    setData(data);
  }

  function formatXAxis(tick: any) {
    return tick.toLocaleString();
  }

  return (
    <section className={styles.graphContainer}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>
          {translations[lang].title}
          {queryWindow}
        </p>
        <div className={styles.buttonContainer}>
          <Button
            text="1 Day"
            className="tertiary"
            onClick={() => {
              setQueryOptions({ maxFuturePools: 3, interval: 3_600, count: 24, roundTicks: true });
              setQueryWindow('for 1 Day');
            }}
          />
          <Button
            text="1 Month"
            className="tertiary"
            onClick={() => {
              setQueryOptions({
                maxFuturePools: 3,
                interval: 3_600 * 24,
                count: 30,
                roundTicks: true
              });
              setQueryWindow('for 1 Month');
            }}
          />
        </div>
      </div>

      <ResponsiveContainer className={styles.graphCard} width="100%" height="100%">
        <>
          <ComposedChart
            width={600}
            height={300}
            data={data}
            margin={{
              top: 5,
              right: 30,
              left: 20,
              bottom: 5
            }}
          >
            <CartesianGrid horizontal vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis
              stroke="#008cf4"
              unit="%"
              label={{ value: 'APR', angle: -90, position: 'insideLeft' }}
            />
            <YAxis
              yAxisId="right"
              orientation="right"
              domain={[0, 1]}
              stroke="#34c53a"
              type="number"
              label={{
                value: 'Utilization',
                angle: +90,
                position: 'insideLeft',
                dy: -35,
                offset: 50
              }}
            />
            <Tooltip
              formatter={(value: number) => `${value.toFixed(2)}%`}
              labelFormatter={(label: any) => formatXAxis(label)}
            />
            <Legend
              verticalAlign="bottom"
              align="left"
              iconType="plainline"
              iconSize={30}
              wrapperStyle={{
                top: '270px',
                right: '-100px'
              }}
            />
            <Line type="monotone" dataKey="rate" stroke="#008cf4" activeDot={{ r: 6 }} />
            <Area
              yAxisId="right"
              type="monotone"
              dataKey="utilization"
              stroke="#34c53a"
              fill="#34c53a"
            />
          </ComposedChart>
        </>
      </ResponsiveContainer>
    </section>
  );
}

export default FloatingAPRChart;

interface Options {
  maxFuturePools?: number | undefined;
  roundTicks?: boolean | undefined;
  interval?: number | undefined;
  count?: number | undefined;
}

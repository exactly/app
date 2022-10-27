import React, { useCallback, useContext, useEffect, useState } from 'react';

import { Line, ComposedChart, XAxis, YAxis, ResponsiveContainer, Tooltip, Legend, CartesianGrid } from 'recharts';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';
import keys from './translations.json';

import getSubgraph from 'utils/getSubgraph';
import queryRates from 'utils/queryRates';

import { LangKeys } from 'types/Lang';
import parseTimestamp from 'utils/parseTimestamp';

interface Props {
  market: string | undefined;
  networkName: string | undefined;
}

function FloatingAPRChart({ market, networkName }: Props) {
  const [data, setData] = useState<any>([]);
  const defaultOptions = {
    maxFuturePools: 3,
    interval: 3_600 * 24,
    count: 30,
    roundTicks: true,
  };

  const [queryOptions] = useState<Options>(defaultOptions);
  const [queryWindow] = useState<string>('1 Month');

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const getHistoricalAPR = useCallback(async () => {
    if (!market || !networkName) return;

    const subgraphUrl = getSubgraph(networkName);

    const data = (await queryRates(subgraphUrl, market, 'deposit', queryOptions)).map(({ apr, apy, ...rest }) => ({
      ...rest,
      apr: apr * 100,
      apy: apy * 100,
    }));

    setData(data);
  }, [market, networkName, queryOptions]);

  function formatXAxis(tick: any) {
    try {
      return parseTimestamp(tick.getTime() / 1000); // directly checks if it's a date
    } catch (error) {
      return tick;
    }
  }

  useEffect(() => {
    getHistoricalAPR();
  }, [getHistoricalAPR]);

  return (
    <section className={styles.graphContainer}>
      <div className={styles.titleContainer}>
        <p className={styles.title}>
          {translations[lang].title}
          {queryWindow}
        </p>
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
              bottom: 5,
            }}
          >
            <CartesianGrid horizontal vertical={false} />
            <XAxis dataKey="date" hide />
            <YAxis stroke="#008cf4" unit="%" label={{ value: 'APR', angle: -90, position: 'insideLeft' }} />
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
                offset: 50,
              }}
            />
            <Tooltip
              formatter={(value: any) => `${value.toFixed(2)}%`}
              labelFormatter={(label: any) => formatXAxis(label)}
            />
            <Legend
              verticalAlign="bottom"
              align="left"
              iconType="plainline"
              iconSize={30}
              wrapperStyle={{
                top: '270px',
                right: '-100px',
              }}
            />
            <Line type="monotone" dataKey="apr" stroke="#008cf4" activeDot={{ r: 6 }} />
            <Line type="monotone" dataKey="utilization" stroke="#34c53a" activeDot={{ r: 6 }} />
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

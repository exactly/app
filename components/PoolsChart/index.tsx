import { useContext, useEffect, useState } from 'react';
import dayjs from 'dayjs';
import relativeTime from 'dayjs/plugin/relativeTime';
import updateLocale from 'dayjs/plugin/updateLocale';

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  ResponsiveContainer,
  Tooltip,
  ZAxis,
  Legend,
  CartesianGrid,
} from 'recharts';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Maturity } from 'types/Maturity';

import styles from './style.module.scss';

import keys from './translations.json';

interface Props {
  deposits: Array<Maturity> | undefined;
  borrows: Array<Maturity> | undefined;
}

function PoolsChart({ deposits, borrows }: Props) {
  const [deposit, setDeposit] = useState<Array<Maturity> | undefined>(undefined);
  const [borrow, setBorrow] = useState<Array<Maturity> | undefined>(undefined);

  useEffect(() => {
    if (deposits && borrows) {
      setDeposit(deposits);
      setBorrow(borrows);
    }
  }, [deposits, borrows]);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const legendStyle = {
    top: '200px',
    right: '-94px',
  };

  const tick = {
    fontSize: '12px',
  };

  const ticks = getXAxisTicks();

  function getXAxisTicks() {
    const data: any = [];
    let now = new Date().getTime() / 1000;
    const monthInSeconds = 2592000; // 30 days ;

    for (let i = 1; i <= 3; i++) {
      data.push(now + monthInSeconds);
      now += monthInSeconds;
    }

    return data;
  }

  function formatXAxis(tick: any) {
    dayjs.extend(relativeTime);
    dayjs.extend(updateLocale);
    dayjs.updateLocale('en', {
      relativeTime: {
        M: '1 month',
        MM: '%d months',
        y: '%d months',
      },
    });

    const parseTick = dayjs(tick * 1000).fromNow(true);

    return parseTick;
  }

  const CustomTooltip = ({ active, payload }: any) => {
    if (active && payload) {
      const type = payload[0].payload.type;

      return (
        <div className={`${type == 'deposit' ? styles.customTooltipDeposit : styles.customTooltipBorrow}`}>
          <p className={styles.label}>{`${payload[2].name}: ${payload[0].payload.date}`}</p>
          <p className={styles.label}>{`${payload[1].name}: ${payload[1].value}%`}</p>
        </div>
      );
    }

    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <p className={styles.title}>{translations[lang].yieldCurve}</p>

      <ResponsiveContainer width="100%" height="100%">
        <ScatterChart>
          <CartesianGrid strokeDasharray="3 1" horizontal={false} />
          <XAxis
            dataKey="value"
            type="number"
            stroke="#8f8c9c"
            tickMargin={16}
            tickFormatter={(tick) => formatXAxis(tick)}
            tick={tick}
            ticks={ticks}
            domain={[() => Date.now() / 1_000, () => Date.now() / 1_000 + 7_776_000]}
            scale="time"
          />
          <YAxis
            dataKey="apr"
            name="Last APR"
            unit="%"
            stroke="#8f8c9c"
            tickMargin={16}
            tickLine={false}
            domain={['dataMin', 'dataMax ']}
            padding={{ bottom: 40, top: 10 }}
            tick={tick}
          />
          <ZAxis dataKey="date" name="Maturity" />
          <Tooltip cursor={{ strokeDasharray: '4 4' }} content={<CustomTooltip />} />
          <Legend verticalAlign="bottom" align="left" iconType="plainline" iconSize={30} wrapperStyle={legendStyle} />
          <Scatter name="Deposit" data={deposit} fill="#008cf4" line id="deposit" />
          <Scatter name="Borrow" data={borrow} fill="#34c53a" line id="borrow" />
        </ScatterChart>
      </ResponsiveContainer>
    </div>
  );
}

export default PoolsChart;

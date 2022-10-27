import React, { useContext } from 'react';
import Skeleton from 'react-loading-skeleton';
import dynamic from 'next/dynamic';

const Item = dynamic(() => import('./Item'));

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  type: Option | undefined;
  maturities: any | undefined;
};

function MaturityPoolUserStatusByMaturity({ type, maturities }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      {type && maturities ? (
        Object.keys(
          type.value === 'deposit' && maturities.deposits
            ? maturities?.deposits
            : type.value === 'borrow' && maturities.borrows
            ? maturities?.borrows
            : {},
        ).map((maturity: any, key) => {
          const oneHour = 3600;
          const oneDay = oneHour * 24;
          const maturityLife = oneDay * 7 * 12;
          const nowInSeconds = Date.now() / 1000;
          const startDate = parseInt(maturity) - maturityLife;
          const current = nowInSeconds - startDate;
          const progress = (current * 100) / maturityLife;

          return (
            <div className={styles.container} key={key}>
              <div className={styles.market}>
                <div className={styles.column}>
                  {key === 0 && ( //HACK until we add MUI grid
                    <div className={styles.tableRow}>
                      <span className={styles.symbol}>{translations[lang].asset}</span>
                      <span className={styles.title}>
                        {type.value === 'deposit'
                          ? translations[lang].depositedAmount
                          : translations[lang].borrowedAmount}
                      </span>
                      <span className={styles.title}>{translations[lang].averageFixedRate}</span>
                      <span className={styles.title}>{translations[lang].maturityDate}</span>
                      <span className={styles.title}>{translations[lang].timeElapsed}</span>
                      <span className={styles.title} />
                    </div>
                  )}

                  {type.value === 'deposit' &&
                    maturities?.deposits[maturity]?.map((pool: any, key: number) => {
                      const { principal, fee, symbol, market, decimals } = pool;
                      return (
                        <Item
                          type={type}
                          key={key}
                          amount={principal}
                          fee={fee}
                          maturityDate={maturity}
                          symbol={symbol}
                          market={market}
                          progress={progress}
                          decimals={decimals}
                          data={{ assets: principal, fee: fee, market: market, maturity, symbol }}
                        />
                      );
                    })}

                  {type.value === 'borrow' &&
                    maturities?.borrows[maturity]?.map((pool: any, key: number) => {
                      const { principal, fee, symbol, market, decimals } = pool;

                      return (
                        <Item
                          type={type}
                          key={key}
                          amount={principal}
                          fee={fee}
                          maturityDate={maturity}
                          symbol={symbol}
                          market={market}
                          progress={progress}
                          decimals={decimals}
                          data={{ assets: principal, fee: fee, market: market, maturity, symbol }}
                        />
                      );
                    })}
                </div>
              </div>
            </div>
          );
        })
      ) : (
        <div className={styles.container}>
          <div className={styles.infoContainer}>
            <div className={styles.dateContainer}>
              <p className={styles.title}>
                <Skeleton width={100} />
              </p>
              <p className={styles.date}>
                <Skeleton />
              </p>
            </div>
            <div className={styles.dateContainer}>
              <p className={styles.title}>
                <Skeleton />
              </p>
              <div className={styles.progress}>
                <Skeleton height={24} />
              </div>
            </div>
          </div>
          <div className={styles.market}>
            <div className={styles.column}>
              <div className={styles.tableRow}>
                <span className={styles.symbol}>{translations[lang].asset}</span>
                <span className={styles.title}>{translations[lang].marketSize}</span>
                <span className={styles.title}>{translations[lang].averageFixedRate}</span>
                <span className={styles.title} />
              </div>

              <Item
                type={undefined}
                key={undefined}
                amount={undefined}
                fee={undefined}
                maturityDate={undefined}
                symbol={undefined}
                market={undefined}
                progress={undefined}
                decimals={undefined}
                data={undefined}
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default MaturityPoolUserStatusByMaturity;

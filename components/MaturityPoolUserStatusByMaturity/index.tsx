import { useContext } from 'react';
import Image from 'next/image';
import dayjs from 'dayjs';
import Skeleton from 'react-loading-skeleton';

import Item from './Item';
import Tooltip from 'components/Tooltip';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  type: Option | undefined;
  maturities: any | undefined;
  showModal: (data: Deposit | Borrow, type: String) => void;
};

function MaturityPoolUserStatusByMaturity({ type, maturities, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      {type && maturities ? (
        Object.keys(
          type.value == 'deposit' && maturities.deposits
            ? maturities?.deposits
            : type.value == 'borrow' && maturities.borrows
            ? maturities?.borrows
            : {}
        ).map((maturity: any, key) => {
          const oneHour = 3600;
          const oneDay = oneHour * 24;
          const maturityLife = oneDay * 7 * 12;
          const nowInSeconds = Date.now() / 1000;
          const startDate = parseInt(maturity) - maturityLife;
          const current = nowInSeconds - startDate;
          const progress = (current * 100) / maturityLife;
          const daysRemaining = dayjs.unix(maturity).diff(dayjs(), 'days');

          const rtf = new Intl.RelativeTimeFormat('en', {
            localeMatcher: 'best fit',
            numeric: 'always',
            style: 'long'
          });

          return (
            <div className={styles.container} key={key}>
              <div className={styles.infoContainer}>
                <div className={styles.dateContainer}>
                  <p className={styles.title}>{translations[lang].maturityDate}</p>
                  <p className={styles.date}>{parseTimestamp(maturity)}</p>
                </div>
                <div className={styles.dateContainer}>
                  <p className={styles.title}>{translations[lang].timeElapsed}</p>
                  <div className={styles.progress}>
                    <Tooltip
                      value={`${
                        daysRemaining <= 0
                          ? translations[lang].finished
                          : `${rtf.format(daysRemaining, 'day')}`
                      }`}
                      disableImage
                    >
                      <div className={styles.track}>
                        {progress >= 100 && (
                          <>
                            {Array(26)
                              .fill('a')
                              .map((_, key) => {
                                return (
                                  <span
                                    className={
                                      type.value == 'deposit' ? styles.fullBar : styles.elapsedBar
                                    }
                                    key={key}
                                  />
                                );
                              })}
                            <Image
                              className={styles.image}
                              src={
                                type.value == 'deposit'
                                  ? '/img/icons/okTick.svg'
                                  : '/img/icons/xTick.svg'
                              }
                              width={21}
                              height={21}
                            />
                          </>
                        )}
                        {progress < 100 && (
                          <>
                            {Array(Math.floor((progress * 26) / 100))
                              .fill('a')
                              .map((_, key) => {
                                return <span className={styles.incompleteBar} key={key} />;
                              })}
                            {Array(Math.ceil(26 - (progress * 26) / 100))
                              .fill('a')
                              .map((_, key) => {
                                return <span className={styles.emptyBar} key={key} />;
                              })}
                          </>
                        )}
                      </div>
                    </Tooltip>
                  </div>
                </div>
              </div>
              <div className={styles.market}>
                <div className={styles.column}>
                  <div className={styles.tableRow}>
                    <span className={styles.symbol}>{translations[lang].asset}</span>
                    <span className={styles.title}>
                      {type.value == 'deposit'
                        ? translations[lang].depositedAmount
                        : translations[lang].borrowedAmount}
                    </span>
                    <span className={styles.title}>{translations[lang].fixedRate}</span>
                    <span className={styles.title} />
                  </div>

                  {type.value == 'deposit' &&
                    maturities.hasOwnProperty('deposits') &&
                    maturities?.deposits[maturity]?.map((pool: any, key: number) => {
                      const { principal, fee, symbol, market, decimals } = pool;
                      return (
                        <Item
                          type={type}
                          key={key}
                          amount={principal}
                          fee={fee}
                          maturityDate={maturity}
                          showModal={showModal}
                          symbol={symbol}
                          market={market}
                          decimals={decimals}
                          data={{ assets: principal, fee: fee, market: market, maturity, symbol }}
                        />
                      );
                    })}

                  {type.value == 'borrow' &&
                    maturities.hasOwnProperty('borrows') &&
                    maturities?.borrows[maturity]?.map((pool: any, key: number) => {
                      const { principal, fee, symbol, market, decimals } = pool;

                      return (
                        <Item
                          type={type}
                          key={key}
                          amount={principal}
                          fee={fee}
                          maturityDate={maturity}
                          showModal={showModal}
                          symbol={symbol}
                          market={market}
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
                <span className={styles.title}>{translations[lang].fixedRate}</span>
                <span className={styles.title} />
              </div>

              <Item
                type={undefined}
                key={undefined}
                amount={undefined}
                fee={undefined}
                maturityDate={undefined}
                showModal={() => undefined}
                symbol={undefined}
                market={undefined}
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

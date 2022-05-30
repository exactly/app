import { useContext } from 'react';
import Image from 'next/image';

import Item from './Item';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';

import styles from './style.module.scss';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  type: Option;
  maturities: any;
  showModal: (data: Deposit | Borrow, type: String) => void;
};

function MaturityPoolUserStatusByMaturity({ type, maturities, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <>
      {Object.keys(type.value == 'deposit' ? maturities.deposits : maturities.borrows ?? {}).map(
        (maturity: any, key) => {
          const oneHour = 3600;
          const oneDay = oneHour * 24;
          const maturityLife = oneDay * 7 * 12;
          const nowInSeconds = Date.now() / 1000;
          const startDate = parseInt(maturity) - maturityLife;
          const current = nowInSeconds - startDate;
          const progress = (current * 100) / maturityLife;

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
                    <div className={styles.track}>
                      {progress >= 100 && (
                        <>
                          {Array(26)
                            .fill('a')
                            .map((_, key) => {
                              return <div className={styles.fullBar} key={key} />;
                            })}
                          <Image
                            className={styles.image}
                            src="/img/icons/okTick.svg"
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
                              return <div className={styles.incompleteBar} key={key} />;
                            })}
                          {Array(Math.ceil(26 - (progress * 26) / 100))
                            .fill('a')
                            .map((_, key) => {
                              return <div className={styles.emptyBar} key={key} />;
                            })}
                        </>
                      )}
                    </div>
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

                  {type.value == 'deposit' &&
                    maturities.deposits &&
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
                    maturities.borrows &&
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
        }
      )}
    </>
  );
}

export default MaturityPoolUserStatusByMaturity;

import { useContext } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';

type Props = {
  type: Option;
  maturities: any;
  showModal: (data: Deposit | Borrow, type: String) => void;
};

function MaturityPoolUserStatusByAsset({ type, maturities, showModal }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.container}>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>{translations[lang].amount}</span>
            <span className={styles.title}>{translations[lang].fixedRate}</span>
            <span className={styles.title}>{translations[lang].maturityDate}</span>
            <span className={styles.title}>{translations[lang].progress}</span>
            <span className={styles.title} />
          </div>

          {/* {type.value == 'borrow' &&
            maturities.borrows &&
            Object.keys(maturities.borrows)?.map((maturity: string, key: number) => {
              const { principal, fee, symbol, fixedLender, decimals } =
                maturities.borrows[maturity];

              return (
                <Item
                  type={type}
                  key={key}
                  amount={principal}
                  fee={fee}
                  maturityDate={maturity}
                  showModal={showModal}
                  symbol={symbol}
                  decimals={decimals}
                  data={{ assets: principal, fee: fee, market: fixedLender, maturity, symbol }}
                />
              );
            })} */}
          {/* 
          {type.value == 'deposit' &&
            maturities.deposits &&
            Object.keys(maturities.deposits)?.map((maturity: string, key: number) => {
              const { principal, fee, symbol, fixedLender, decimals } =
                maturities.deposits[maturity];

              return (
                <Item
                  type={type}
                  key={key}
                  amount={principal}
                  fee={fee}
                  maturityDate={maturity}
                  showModal={showModal}
                  symbol={symbol}
                  decimals={decimals}
                  data={{ assets: principal, fee: fee, market: fixedLender, maturity, symbol }}
                />
              );
            })} */}
        </div>
      </div>
    </div>
  );
}

export default MaturityPoolUserStatusByAsset;

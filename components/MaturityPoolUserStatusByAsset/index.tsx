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
  deposits: Deposit[];
  borrows: Borrow[];
  showModal: (data: Deposit | Borrow, type: String) => void;
};

function MaturityPoolUserStatusByAsset({ type, deposits, borrows, showModal }: Props) {
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

          {type.value == 'borrow' &&
            borrows.map((borrow: Borrow, key: number) => {
              return (
                <Item
                  type={type}
                  key={key}
                  amount={borrow.assets}
                  fee={borrow.fee}
                  maturityDate={borrow.maturity}
                  showModal={showModal}
                  market={borrow.market}
                  data={borrow}
                />
              );
            })}

          {type.value == 'deposit' &&
            deposits.map((deposit: Deposit, key: number) => {
              return (
                <Item
                  type={type}
                  key={key}
                  amount={deposit.assets}
                  fee={deposit.fee}
                  maturityDate={deposit.maturity}
                  showModal={showModal}
                  market={deposit.market}
                  data={deposit}
                />
              );
            })}
        </div>
      </div>
    </div>
  );
}

export default MaturityPoolUserStatusByAsset;

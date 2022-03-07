import { useContext } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';
import { Deposit } from 'types/Deposit';

type Props = {
  deposits: Deposit[],
};

function SmartPoolUserStatus({ deposits }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.container}>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>
              {translations[lang].currentBalance}
            </span>
            <span className={styles.title}>{translations[lang].liquidity}</span>
            <span className={styles.title}>
              {translations[lang].collateral}
            </span>

            <span className={styles.title} />
          </div>

          {deposits.map((deposit: Deposit, key: number) => {
            return (
              <Item key={key} amount={deposit.amount} fee={deposit.fee} maturityDate={deposit.maturityDate} symbol={deposit.symbol} />
            )
          })}

        </div>
      </div>
    </div>
  );
}

export default SmartPoolUserStatus;

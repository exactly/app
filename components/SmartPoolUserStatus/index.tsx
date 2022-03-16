import { useContext } from 'react';

import Item from './Item';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';
import { Deposit } from 'types/Deposit';
import { Dictionary } from 'types/Dictionary';

type Props = {
  walletAddress: string
  deposits: Dictionary<number> | undefined,
};

function SmartPoolUserStatus({ deposits, walletAddress }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.container}>
      <div className={styles.market}>
        <div className={styles.column}>
          <div className={styles.tableRow}>
            <span className={styles.symbol}>{translations[lang].asset}</span>
            <span className={styles.title}>
              {translations[lang].walletBalance}
            </span>
            <span className={styles.title}>
              {translations[lang].currentBalance}
            </span>
            <span className={styles.title}>{translations[lang].liquidity}</span>
            <span className={styles.title}>
              {translations[lang].collateral}
            </span>

            <span className={styles.title} />
          </div>

          {deposits && Object.keys(deposits).map((symbol: string, key: number) => {
            const amount: string = JSON.stringify(deposits[symbol])
            return (
              <Item key={key} amount={amount} symbol={symbol} walletAddress={walletAddress} />
            )
          })}

        </div>
      </div>
    </div>
  );
}

export default SmartPoolUserStatus;

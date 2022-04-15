import { useContext } from 'react';
import { ethers } from 'ethers';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Deposit } from 'types/Deposit';
import { Borrow } from 'types/Borrow';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';

import parseTimestamp from 'utils/parseTimestamp';

type Props = {
  type?: Option;
  amount: string;
  fee: string;
  maturityDate: string;
  symbol: string;
  showModal: (data: Deposit, type: String) => void;
  market: Deposit | Borrow;
};

function Item({ symbol, type, amount, fee, maturityDate, showModal, market }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const oneHour = 3600;
  const oneDay = oneHour * 24;
  const maturityLife = oneDay * 7 * 12;
  const nowInSeconds = Date.now() / 1000;
  const startDate = parseInt(maturityDate) - maturityLife;
  const current = nowInSeconds - startDate;
  const progress = (current * 100) / maturityLife;
  const fixedRate = (parseInt(fee) * 100) / parseInt(amount);

  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <img src={`/img/assets/${symbol.toLowerCase()}.png`} className={styles.assetImage} />
        <span className={styles.primary}>{symbol}</span>
      </div>
      <span className={styles.value}>{ethers.utils.formatUnits(amount, 18)}</span>
      <span className={styles.value}>{fixedRate.toFixed(2)}%</span>
      <span className={styles.value}>{parseTimestamp(maturityDate)}</span>

      <span className={styles.value}>
        <div className={styles.line}>
          <div
            className={styles.progress}
            style={{ width: `${progress > 100 ? 100 : progress}%` }}
          />
        </div>
      </span>
      {type && (
        <div className={styles.buttonContainer}>
          <Button
            text={type.value == 'borrow' ? translations[lang].repay : translations[lang].withdraw}
            className={type.value == 'borrow' ? 'quaternary' : 'tertiary'}
            onClick={() => {
              showModal(market, type.value == 'borrow' ? 'repay' : 'withdraw');
            }}
          />
        </div>
      )}
    </div>
  );
}

export default Item;

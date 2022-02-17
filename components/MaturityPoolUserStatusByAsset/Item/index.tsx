import { useContext } from 'react';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Market } from 'types/Market';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';
import { ethers } from 'ethers';
import dayjs from 'dayjs'

type Props = {
  type?: Option;
  amount: string;
  fee: string;
  maturityDate: string;
};

function Item({ type, amount, fee, maturityDate }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const oneHour = 3600;
  const oneDay = oneHour * 24;
  const maturityLife = oneDay * 7 * 12; // Make this dynamic, currently one week in seconds

  // console.log(oneMaturity, (parseInt(maturityDate) * 1000) - Date.now())
  const nowInSeconds = Date.now() / 1000;

  const startDate = parseInt(maturityDate) - maturityLife; //Start date
  const current = nowInSeconds - startDate
  const progress = current * 100 / maturityLife;
  const fixedRate = parseInt(fee) * 100 / parseInt(amount);
  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <img src={'/img/assets/dai.png'} className={styles.assetImage} />
        <span className={styles.primary}>DAI</span>
      </div>
      <span className={styles.value}>{ethers.utils.formatUnits(amount, 18)}</span>
      <span className={styles.value}>{fixedRate}%</span>
      <span className={styles.value}>{maturityDate}</span>

      <span className={styles.value}>
        <div className={styles.line}>
          <div className={styles.progress} style={{ width: `${progress}%` }} />
        </div>
      </span>

      <div className={styles.buttonContainer}>
        <Button
          text={
            type?.value == 'borrow'
              ? translations[lang].borrow
              : translations[lang].deposit
          }
          className={type?.value == 'borrow' ? 'secondary' : 'primary'}
        />
      </div>
    </div>
  );
}

export default Item;

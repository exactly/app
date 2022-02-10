import { useContext } from 'react';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';

import { Option } from 'react-dropdown';
import { LangKeys } from 'types/Lang';
import { Market } from 'types/Market';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  market?: Market;
  showModal?: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  type?: Option;
  src?: string;
};

function Item({ market, showModal, type, src }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <img src={'/img/assets/dai.png'} className={styles.assetImage} />
        <span className={styles.primary}>DAI</span>
      </div>
      <span className={styles.value}>17,18</span>
      <span className={styles.value}>4.41%</span>

      <span className={styles.value}>
        <div className={styles.line}>
          <div className={styles.progress} style={{ width: `50%` }} />
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

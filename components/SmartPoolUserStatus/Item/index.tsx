import { useContext, useState } from 'react';

import Button from 'components/common/Button';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Market } from 'types/Market';
import { Option } from 'react-dropdown';

import styles from './style.module.scss';

import keys from './translations.json';
import Switch from 'components/common/Switch';

type Props = {
  market?: Market;
  showModal?: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  src?: string;
};

function Item({ market, showModal, src }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const [toggle, setToggle] = useState<boolean>(false);

  return (
    <div className={styles.container}>
      <div className={styles.symbol}>
        <img src={'/img/assets/dai.png'} className={styles.assetImage} />
        <span className={styles.primary}>DAI</span>
      </div>
      <span className={styles.value}>17,18</span>
      <span className={styles.value}>4.41%</span>
      <span className={styles.value}>21-feb-22</span>

      <span className={styles.value}>4.41%</span>

      <span className={styles.value}>
        <Switch
          isOn={toggle}
          handleToggle={() => {
            setToggle((prev) => !prev);
          }}
          id={market?.address || Math.random().toString()}
        />
      </span>

      <div className={styles.buttonContainer}>
        <Button text={translations[lang].deposit} className="primary" />
      </div>

      <div className={styles.buttonContainer}>
        <Button text={translations[lang].withdraw} className="tertiary" />
      </div>
    </div>
  );
}

export default Item;

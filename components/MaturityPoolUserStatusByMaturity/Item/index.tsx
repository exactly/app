import Button from 'components/common/Button';

import { Option } from 'react-dropdown';
import { Market } from 'types/Market';

import styles from './style.module.scss';

type Props = {
  market?: Market;
  showModal?: (address: Market['address'], type: 'borrow' | 'deposit') => void;
  type?: Option;
  src?: string;
};

function Item({ market, showModal, type, src }: Props) {
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
          text={type?.value == 'borrow' ? 'Borrow' : 'Deposit'}
          className={type?.value == 'borrow' ? 'secondary' : 'primary'}
        />
      </div>
    </div>
  );
}

export default Item;

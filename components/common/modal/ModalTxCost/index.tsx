import { Gas } from 'types/Gas';

import styles from './style.module.scss';

type Props = {
  gas: Gas;
};

function ModalTxCost({ gas }: Props) {
  const { usd, gwei, eth } = gas;

  return (
    <section className={styles.container}>
      <p>Approximate tx cost</p>
      <p>
        {usd && `$ ${usd} /`} {eth && `${eth} ETH / `}
        {gwei && `${gwei} GWEI`}
      </p>
    </section>
  );
}

export default ModalTxCost;

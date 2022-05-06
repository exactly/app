import { useEffect, useState } from 'react';

import { Gas } from 'types/Gas';

import getExchangeRate from 'utils/getExchangeRate';

import styles from './style.module.scss';

type Props = {
  gas: Gas;
};

function ModalTxCost({ gas }: Props) {
  const { gwei, eth } = gas;

  const [exchangeRate, setExchangeRate] = useState(1);

  useEffect(() => {
    getRate();
  }, []);

  async function getRate() {
    const rate = await getExchangeRate('ETH');
    setExchangeRate(rate);
  }

  return (
    <section className={styles.container}>
      <p>Approximate tx cost</p>
      <p>
        {eth && `$ ${(parseFloat(eth) * exchangeRate).toFixed(2)} /`} {eth && `${eth} ETH / `}
        {gwei && `${gwei} GWEI`}
      </p>
    </section>
  );
}

export default ModalTxCost;

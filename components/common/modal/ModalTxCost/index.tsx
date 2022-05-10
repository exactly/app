import { useEffect, useState, useContext } from 'react';
import Skeleton from 'react-loading-skeleton';

import { Gas } from 'types/Gas';
import { LangKeys } from 'types/Lang';

import getExchangeRate from 'utils/getExchangeRate';

import styles from './style.module.scss';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';

type Props = {
  gas: Gas | undefined;
};

function ModalTxCost({ gas }: Props) {
  const translations: { [key: string]: LangKeys } = keys;
  const [exchangeRate, setExchangeRate] = useState(1);

  const lang: string = useContext(LangContext);

  const eth = gas?.eth && `${gas.eth} ETH /`;
  const usd = gas && `$ ${(parseFloat(eth!) * exchangeRate).toFixed(2)} /`;
  const gwei = gas?.gwei && `${gas.gwei} GWEI`;

  useEffect(() => {
    getRate();
  }, []);

  async function getRate() {
    const rate = await getExchangeRate('ETH');
    setExchangeRate(rate);
  }

  return (
    <section className={styles.container}>
      <p>{translations[lang].aproxTxCost}</p>
      <p className={styles.gasCost}>{gas ? `${usd} ${eth} ${gwei}` : <Skeleton />}</p>
    </section>
  );
}

export default ModalTxCost;

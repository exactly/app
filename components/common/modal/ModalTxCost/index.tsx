import { useEffect, useState, useContext } from 'react';
import Skeleton from 'react-loading-skeleton';
import { ethers } from 'ethers';

import { Gas } from 'types/Gas';
import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';

type Props = {
  gas: Gas | undefined;
};

function ModalTxCost({ gas }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [exchangeRate, setExchangeRate] = useState(1);

  const eth = gas?.eth && `${gas.eth} ETH /`;
  const usd = gas && `$ ${(parseFloat(eth!) * exchangeRate).toFixed(2)} /`;
  const gwei = gas?.gwei && `${gas.gwei} GWEI`;

  useEffect(() => {
    getRate();
  }, [accountData]);

  async function getRate() {
    if (!accountData) return;

    const rate = parseFloat(ethers.utils.formatEther(accountData.WETH.oraclePrice));
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

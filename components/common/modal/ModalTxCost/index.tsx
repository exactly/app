import { useContext, useMemo } from 'react';
import Skeleton from 'react-loading-skeleton';
import { utils } from 'ethers';

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

  const exchangeRate = useMemo(() => {
    if (!accountData) return 1;

    return parseFloat(utils.formatEther(accountData.WETH.usdPrice));
  }, [accountData]);

  const eth = gas?.eth && `${gas.eth} ETH`;
  const usd = gas && `$ ${(parseFloat(eth!) * exchangeRate).toFixed(2)} /`;

  return (
    <section className={styles.container}>
      <p>{translations[lang].approxTxCost}</p>
      <p className={styles.gasCost}>{gas ? `${usd} ${eth}` : <Skeleton />}</p>
    </section>
  );
}

export default ModalTxCost;

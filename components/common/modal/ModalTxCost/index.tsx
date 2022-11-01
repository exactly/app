import React, { useContext, useMemo } from 'react';
import { BigNumber, formatFixed } from '@ethersproject/bignumber';
import Skeleton from 'react-loading-skeleton';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';
import AccountDataContext from 'contexts/AccountDataContext';
import { WeiPerEther } from '@ethersproject/constants';

type Props = {
  gasCost?: BigNumber;
};

function ModalTxCost({ gasCost }: Props) {
  const { accountData } = useContext(AccountDataContext);

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const renderGas = useMemo(() => {
    if (!gasCost || !accountData) return <Skeleton width={100} />;

    const eth = parseFloat(formatFixed(gasCost, 18)).toFixed(6);
    const usd = parseFloat(formatFixed(gasCost.mul(accountData.WETH.usdPrice).div(WeiPerEther), 18)).toFixed(2);

    return `$ ${usd} / ${eth} ETH`;
  }, [gasCost, accountData]);

  return (
    <section className={styles.container}>
      <p>{translations[lang].approxTxCost}</p>
      <p className={styles.gasCost}>{renderGas}</p>
    </section>
  );
}

export default ModalTxCost;

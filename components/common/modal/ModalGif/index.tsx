import React, { useContext } from 'react';
import Image from 'next/image';

import styles from './style.module.scss';

import { Dictionary } from 'types/Dictionary';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';
import { ModalCases } from 'types/ModalCases';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import Button from 'components/common/Button';
import Loading from 'components/common/Loading';
import { getTxEtherscanUrl, Network } from 'utils/network';

type Props = {
  tx: Transaction;
  tryAgain: (props: any) => void;
};

function ModalGif({ tx, tryAgain }: Props) {
  const { network } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const options: Dictionary<ModalCases> = {
    processing: {
      img: '',
      title: translations[lang].loadingTitle,
      text: translations[lang].loadingText,
    },
    success: {
      img: '/img/icons/successTick.svg',
      title: translations[lang].successTitle,
      text: translations[lang].successText,
    },
    error: {
      img: '/img/icons/errorTick.svg',
      title: translations[lang].errorTitle,
      text: translations[lang].errorText,
    },
  };

  return (
    <section className={styles.container}>
      <section className={styles.header}>
        {tx.status !== 'processing' && <Image src={options[tx.status].img} width={74} height={74} />}
        {tx.status === 'processing' && <Loading color="primary" />}
        <section className={styles.titleContainer}>
          <h3 className={styles.title}>{options[tx.status].title}</h3>
          <p className={styles.description}>{options[tx.status].text}</p>
        </section>
      </section>

      {tx.hash && (
        <section className={styles.hashContainer}>
          <h3 className={styles.hashTitle}>{translations[lang].transactionHash}</h3>
          <p className={styles.hash}>{tx.hash}</p>
        </section>
      )}

      {tx.status !== 'loading' && network !== undefined && (
        <a
          className={styles.link}
          href={getTxEtherscanUrl(network?.name as Network, tx.hash as string)}
          target="_blank"
          rel="noopener noreferrer"
        >
          {translations[lang].etherscanText}
        </a>
      )}

      {tx.status === 'error' && (
        <div className={styles.buttonContainer}>
          <Button text={translations[lang].errorButton} onClick={tryAgain} />
        </div>
      )}
    </section>
  );
}

export default ModalGif;

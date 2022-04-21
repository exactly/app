import { useContext } from 'react';

import styles from './style.module.scss';

import { Dictionary } from 'types/Dictionary';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';
import { ModalCases } from 'types/ModalCases';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';

type Props = {
  tx: Transaction;
};

function ModalGif({ tx }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const options: Dictionary<ModalCases> = {
    processing: {
      img: '',
      title: translations[lang].loadingTitle
    },
    success: {
      img: '',
      title: translations[lang].successTitle
    },
    error: {
      img: '',
      title: translations[lang].errorTitle,
      text: translations[lang].errorText
    }
  };

  return (
    <div className={styles.container}>
      <img src={options[tx.status].img} className={styles.img} />
      <h3 className={styles.title}>{options[tx.status].title}</h3>

      {tx.status == 'error' ? (
        <p className={styles.text}>{options[tx.status].text}</p>
      ) : (
        <p className={styles.hash}>
          <span className={styles.hashTitle}>
            {translations[lang].transactionHash}{' '}
          </span>
          {tx.hash}
        </p>
      )}

      {tx.status != 'loading' && (
        <p className={styles.link}>
          {translations[lang].etherscanText}{' '}
          <a
            className={styles.etherscan}
            href={`https://kovan.etherscan.io/tx/${tx.hash}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Etherscan
          </a>
        </p>
      )}

      {tx.status == 'error' && (
        <button> {translations[lang].errorButton}</button>
      )}
    </div>
  );
}

export default ModalGif;

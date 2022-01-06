import { useContext } from 'react';

import styles from './style.module.scss';

import { Dictionary } from 'types/Dictionary';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';

type Props = {
  tx: Transaction;
  handleMinimize: () => void;
};

function MinimizedModal({ tx, handleMinimize }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const options: Dictionary<Dictionary<string>> = {
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

  function handleClick() {
    handleMinimize();
  }

  return (
    <div className={styles.container}>
      <img
        src="./img/icons/open.svg"
        className={styles.open}
        onClick={handleClick}
      />
      <h3 className={styles.title}>{options[tx.status].title}</h3>
      <div className={styles.loading}>
        {tx.status != 'success' ? (
          <div className={styles.loadingLine}></div>
        ) : (
          <div className={styles.doneLine}></div>
        )}
      </div>
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
    </div>
  );
}

export default MinimizedModal;

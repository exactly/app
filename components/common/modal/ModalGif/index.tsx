import { useContext } from 'react';

import styles from './style.module.scss';

import { Dictionary } from 'types/Dictionary';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';
import { ModalCases } from 'types/ModalCases';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import Button from 'components/common/Button';

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
      img: '/img/modals/img/waiting.png',
      video: '/img/modals/video/waiting.mp4',
      title: translations[lang].loadingTitle
    },
    success: {
      img: '/img/modals/img/success.png',
      video: '/img/modals/video/success.mp4',
      title: translations[lang].successTitle
    },
    error: {
      img: '/img/modals/img/error.png',
      video: '/img/modals/video/error.mp4',
      title: translations[lang].errorTitle,
      text: translations[lang].errorText
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.mediaContainer}>
        <img src="/img/icons/circles.svg" alt="circles" className={styles.img} />
        <video
          autoPlay
          loop
          poster={options[tx.status].img}
          className={styles.video}
          src={options[tx.status].video}
        />
      </div>
      <h3 className={styles.title}>{options[tx.status].title}</h3>

      {tx.status == 'error' ?? <p className={styles.text}>{options[tx.status].text}</p>}

      <p className={styles.hash}>
        <span className={styles.hashTitle}>{translations[lang].transactionHash} </span>
        {tx.hash}
      </p>

      {tx.status != 'loading' && (
        <p className={styles.link}>
          {translations[lang].etherscanText}{' '}
          <a
            className={styles.etherscan}
            href={`https://${network?.name ?? process.env.NEXT_PUBLIC_NETWORK}.etherscan.io/tx/${
              tx.hash
            }`}
            target="_blank"
            rel="noopener noreferrer"
          >
            Etherscan
          </a>
        </p>
      )}

      {tx.status == 'error' && (
        <div className={styles.buttonContainer}>
          <Button text={translations[lang].errorButton} onClick={tryAgain} />
        </div>
      )}
    </div>
  );
}

export default ModalGif;

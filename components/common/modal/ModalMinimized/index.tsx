import { useContext } from 'react';
import { useSpring, animated } from 'react-spring';

import styles from './style.module.scss';

import { Dictionary } from 'types/Dictionary';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';
import { ModalCases } from 'types/ModalCases';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

type Props = {
  tx: Transaction;
  handleMinimize: () => void;
};

function ModalMinimized({ tx, handleMinimize }: Props) {
  const { network } = useWeb3Context();

  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const style = useSpring({ from: { opacity: 0 }, to: { opacity: 1 }, duration: 5000 });

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
    <animated.section style={style} className={styles.container}>
      <img
        src="./img/icons/open.svg"
        alt="open"
        className={styles.open}
        onClick={() => handleMinimize()}
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
          href={`https://${network?.name ?? process.env.NEXT_PUBLIC_NETWORK}.etherscan.io/tx/${
            tx.hash
          }`}
          target="_blank"
          rel="noopener noreferrer"
        >
          Etherscan
        </a>
      </p>
    </animated.section>
  );
}

export default ModalMinimized;

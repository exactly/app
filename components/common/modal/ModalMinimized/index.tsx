import { useContext } from 'react';
import { useSpring, animated } from 'react-spring';
import Image from 'next/image';

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
      title: translations[lang].loadingTitle,
      text: translations[lang].loadingText
    },
    success: {
      img: '/img/modals/img/success.png',
      title: translations[lang].successTitle,
      text: translations[lang].successText
    },
    error: {
      img: '/img/modals/img/error.png',
      title: translations[lang].errorTitle,
      text: translations[lang].errorText
    }
  };

  return (
    <animated.section style={style} className={styles.container}>
      <div className={styles.open}>
        <Image
          src="/img/icons/open.svg"
          alt="open"
          onClick={() => handleMinimize()}
          width={16}
          height={16}
        />
      </div>
      <h3 className={styles.title}>{options[tx.status].title}</h3>
      <div className={styles.loading}>
        {tx.status == 'success' ? (
          <div className={styles.doneLine}></div>
        ) : tx.status == 'error' ? (
          <div className={styles.errorLine}></div>
        ) : (
          <div className={styles.loadingLine}></div>
        )}
      </div>

      {tx.hash && (
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
    </animated.section>
  );
}

export default ModalMinimized;

import { useContext } from 'react';

import styles from './style.module.scss';

import { Contract } from 'ethers';
import { Dictionary } from 'types/Dictionary';
import { Transaction } from 'types/Transaction';
import { LangKeys } from 'types/Lang';
import { ModalCases } from 'types/ModalCases';

import keys from './translations.json';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

type Props = {
  tx: Transaction;
  symbol?: string;
  contract?: Contract;
};

function ModalGif({ tx, symbol, contract }: Props) {
  const { web3Provider, network } = useWeb3Context();

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

  async function handleAddToken() {
    if (!web3Provider?.provider.request || !contract || !symbol) return;

    try {
      const decimals = await contract.decimals();
      const address = await contract.address;

      //we can detect if the user added the token or not
      //we need to change the token url, it can't be local hosted, needs to be public

      await web3Provider.provider.request({
        method: 'wallet_watchAsset',
        params: {
          // @ts-ignore
          type: 'ERC20',
          options: {
            address,
            symbol: `e${symbol}`,
            decimals,
            image: ''
          }
        }
      });
    } catch (e) {
      console.log(e);
    }
  }

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

      {tx.status == 'error' ? (
        <p className={styles.text}>{options[tx.status].text}</p>
      ) : (
        <p className={styles.hash}>
          <span className={styles.hashTitle}>{translations[lang].transactionHash} </span>
          {tx.hash}
        </p>
      )}

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

      {tx.status == 'success' && contract && (
        <p className={styles.link} onClick={handleAddToken}>
          <span className={styles.addToken}> {translations[lang].addToken}</span>
        </p>
      )}

      {tx.status == 'error' && <button> {translations[lang].errorButton}</button>}
    </div>
  );
}

export default ModalGif;

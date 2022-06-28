import { useContext, useEffect, useState } from 'react';

import styles from './style.module.scss';

import keys from './translations.json';

import { formatWallet } from 'utils/utils';

import LangContext from 'contexts/LangContext';

import { LangKeys } from 'types/Lang';
import { Network } from 'types/Network';
import { useWeb3 } from 'hooks/useWeb3';

type Props = {
  walletAddress: string;
  cogwheel?: Boolean;
  network?: Network | null | undefined;
  disconnect: () => Promise<void>;
};

function Wallet({ walletAddress, cogwheel = true, network, disconnect }: Props) {
  const lang: string = useContext(LangContext);

  const { web3Provider } = useWeb3();

  const translations: { [key: string]: LangKeys } = keys;
  const formattedWallet = walletAddress && formatWallet(walletAddress);
  const [walletContainer, setWalletContainer] = useState<Boolean>(false);
  const [ens, setEns] = useState<string | null>(null);

  function handleWallet() {
    setWalletContainer((prev) => !prev);
  }

  useEffect(() => {
    if (!walletAddress || !web3Provider) return;
    getENS(walletAddress);
  }, [walletAddress, web3Provider]);

  async function getENS(walletAddress: string) {
    if (!web3Provider) return;

    try {
      const ens = await web3Provider.lookupAddress(walletAddress);

      setEns(ens);
    } catch (e) {
      console.log(e);
    }
  }

  return (
    <div className={styles.container}>
      <p className={styles.wallet} onClick={handleWallet}>
        {ens ?? formattedWallet}
      </p>
      {cogwheel && (
        <img
          src={`/img/icons/${walletContainer ? 'arrowUp' : 'arrowDown'}.svg`}
          alt="settings"
          onClick={handleWallet}
        />
      )}
      {network && (
        <div className={styles.networkContainer}>
          <div className={styles.dot} />
          <p className={styles.network}> {network?.name}</p>
        </div>
      )}

      {walletContainer && (
        <div className={styles.walletContainer}>
          {walletAddress && (
            <p className={styles.disconnect} onClick={() => disconnect && disconnect()}>
              <img src="/img/icons/power.svg" />
              {translations[lang].disconnect}
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Wallet;

import React, { useEffect, useState } from 'react';
import Image from 'next/image';

import styles from './style.module.scss';

import { formatWallet } from 'utils/utils';

import { Network } from 'types/Network';
import { useWeb3 } from 'hooks/useWeb3';
import { captureException } from '@sentry/nextjs';

type Props = {
  walletAddress: string;
  cogwheel?: boolean;
  network?: Network | null | undefined;
  disconnect: () => Promise<void>;
};

function Wallet({ walletAddress, cogwheel = true, network, disconnect }: Props) {
  const { web3Provider } = useWeb3();

  const formattedWallet = formatWallet(walletAddress);
  const [walletContainer, setWalletContainer] = useState<boolean>(false);
  const [ens, setEns] = useState<string | null>(null);

  function handleWallet() {
    setWalletContainer((prev) => !prev);
  }

  useEffect(() => {
    if (!web3Provider) return;

    const loadENS = async () => setEns(await web3Provider.lookupAddress(walletAddress));

    loadENS().catch(captureException);
  }, [walletAddress, web3Provider]);

  return (
    <div className={styles.container}>
      <p className={styles.wallet} onClick={handleWallet}>
        {ens ?? formattedWallet}
      </p>
      {cogwheel && (
        <Image
          src={`/img/icons/${walletContainer ? 'arrowUp' : 'arrowDown'}.svg`}
          alt="settings"
          onClick={handleWallet}
          width={12}
          height={7}
        />
      )}
      {network && (
        <div className={styles.networkContainer}>
          <div className={styles.dot} />
          <p className={styles.network}> {network.name}</p>
        </div>
      )}

      {walletContainer && (
        <div className={styles.walletContainer}>
          {walletAddress && (
            <p className={styles.disconnect} onClick={disconnect}>
              <Image src="/img/icons/power.svg" alt="power" width={24} height={24} />
              Disconnect wallet
            </p>
          )}
        </div>
      )}
    </div>
  );
}

export default Wallet;

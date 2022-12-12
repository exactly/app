import React, { useState } from 'react';
import { useEnsName } from 'wagmi';
import Image from 'next/image';

import styles from './style.module.scss';

import { formatWallet } from 'utils/utils';

import { Network } from 'types/Network';

type Props = {
  walletAddress: string;
  cogwheel?: boolean;
  network?: Network | null | undefined;
  disconnect: () => Promise<void>;
};

function Wallet({ walletAddress, cogwheel = true, network, disconnect }: Props) {
  const { data: ens } = useEnsName({ address: walletAddress as `0x${string}` });

  const formattedWallet = formatWallet(walletAddress);
  const [walletContainer, setWalletContainer] = useState<boolean>(false);

  function handleWallet() {
    setWalletContainer((prev) => !prev);
  }

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

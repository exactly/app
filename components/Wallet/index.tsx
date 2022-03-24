import styles from './style.module.scss';

import { formatWallet } from 'utils/utils';
import { Network } from 'types/Network';

type Props = {
  walletAddress: string | undefined | null;
  cogwheel?: Boolean;
  network?: Network | null | undefined;
  disconnect: () => Promise<void>;
};

function Wallet({ walletAddress, cogwheel = true, network, disconnect }: Props) {
  const formattedWallet = walletAddress && formatWallet(walletAddress);

  return (
    <div className={styles.container}>
      <p className={styles.wallet}>{formattedWallet}</p>
      {cogwheel && <img src="/img/icons/cogwheel.svg" alt="settings" onClick={disconnect} />}
      {network && (
        <div className={styles.networkContainer}>
          <div className={styles.dot} />
          <p className={styles.network}> {network?.name}</p>
        </div>
      )}
    </div>
  );
}

export default Wallet;

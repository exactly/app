import styles from './style.module.scss';
import { formatWallet } from 'utils/utils';

type Props = {
  walletAddress: String;
};

function Wallet({ walletAddress }: Props) {
  const formatedWallet = formatWallet(walletAddress);

  return (
    <div className={styles.container}>
      <p>{formatedWallet}</p>
      <img src="/img/icons/cogwheel.svg" alt="settings" />
    </div>
  );
}

export default Wallet;

import styles from "./style.module.scss";
import { formatWallet } from "utils/utils";

type Props = {
  walletAddress: String;
};

function Wallet({ walletAddress }: Props) {
  const formatedWallet = formatWallet(walletAddress);

  return (
    <div className={styles.container}>
      <img src="/img/metamask.svg" alt="metamask" className={styles.icon} />
      <p>{formatedWallet}</p>
    </div>
  );
}

export default Wallet;

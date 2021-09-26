import styles from "./style.module.scss";

type Props = {
  walletAddress: String;
};

function Wallet({ walletAddress }: Props) {
  const formatedWallet = `${String(walletAddress).substring(0, 6)}...${String(
    walletAddress
  ).substring(38)}`;

  return (
    <div className={styles.container}>
      <img src="/img/metamask.svg" alt="metamask" className={styles.icon} />
      <p>{formatedWallet}</p>
    </div>
  );
}

export default Wallet;

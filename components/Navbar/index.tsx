import { useState, useEffect } from "react";
import Link from "next/link";
import styles from "./style.module.scss";

import useProvider from "hooks/useProvider";
import { getCurrentWalletConnected } from "hooks/useWallet";

import Button from "components/common/Button";
import Wallet from "components/Wallet";

function Navbar() {
  const [walletAddress, setWallet] = useState("");
  const { getProvider } = useProvider();

  useEffect(() => {
    handleWallet();
    addWalletListener();
  }, []);

  async function handleWallet() {
    //this function gets the wallet address
    const { address } = await getCurrentWalletConnected();

    setWallet(address);
  }

  async function handleClick() {
    //this function generates the connection to the provider
    await getProvider();
  }

  function addWalletListener() {
    //we listen to any change in wallet
    if (window.ethereum) {
      window.ethereum.on("accountsChanged", (accounts: any) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
        } else {
          setWallet("");
        }
      });
    }
  }

  return (
    <nav className={styles.navBar}>
      <Link href="/">
        <img src="/img/logo.svg" alt="Exactly Logo" className={styles.link} />
      </Link>
      {!walletAddress ? (
        <div className={styles.buttonContainer}>
          <Button
            text="Conectar"
            onClick={handleClick}
            className={styles.connectButton}
          />
        </div>
      ) : (
        <div className={styles.buttonContainer}>
          <Wallet walletAddress={walletAddress} />
        </div>
      )}
    </nav>
  );
}

export default Navbar;

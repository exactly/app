import { useState, useEffect, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import useProvider from 'hooks/useProvider';
import { getCurrentWalletConnected } from 'hooks/useWallet';

import LangContext from 'contexts/LangContext';

import Button from 'components/common/Button';
import Wallet from 'components/Wallet';
import Overlay from 'components/Overlay';

import { LangKeys } from 'types/Lang';
import { Network } from 'types/Network';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  walletAddress?: String;
  network: string;
};

function MobileNavbar({ walletAddress, network }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const [currentWallet, setWallet] = useState<String>(walletAddress || '');
  const [open, setOpen] = useState<Boolean>(false);
  const { getProvider } = useProvider();
  const router = useRouter();
  const { pathname } = router;

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
      window.ethereum.on('accountsChanged', (accounts: any) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
        } else {
          setWallet('');
        }
      });
    }
  }

  function handleMenu() {
    setOpen((prev) => !prev);
  }

  const routes = [
    {
      pathname: '/assets/[id]',
      href: '/assets/dai',
      name: translations[lang].assets
    },
    { pathname: '/dashboard', href: '/', name: translations[lang].dashboard },
    { pathname: '/nerd-mode', href: '/', name: translations[lang].nerdMode }
  ];

  return (
    <>
      {open && <Overlay closeModal={handleMenu} />}
      <nav className={styles.navBar}>
        <div className={styles.wrapper}>
          <Link href="/">
            <img
              src="/img/logo.svg"
              alt="Exactly Logo"
              className={styles.logo}
            />
          </Link>
          {!walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Conectar" onClick={handleClick} />
            </div>
          ) : (
            <div className={styles.buttonContainer}>
              <Wallet
                walletAddress={currentWallet}
                cogwheel={false}
                network={network}
              />
            </div>
          )}
          {!open ? (
            <img
              src="./img/icons/hamburger.svg"
              onClick={handleMenu}
              className={styles.icon}
            />
          ) : (
            <img
              src="./img/icons/close.svg"
              onClick={handleMenu}
              className={styles.icon}
            />
          )}
        </div>
      </nav>
      {open && (
        <ul className={styles.menu}>
          {routes.map((route) => {
            return (
              <li
                className={
                  route.pathname === pathname
                    ? `${styles.link} ${styles.active}`
                    : styles.link
                }
                key={route.pathname}
              >
                <Link href={route.href}>{route.name}</Link>
              </li>
            );
          })}
        </ul>
      )}
    </>
  );
}

export default MobileNavbar;

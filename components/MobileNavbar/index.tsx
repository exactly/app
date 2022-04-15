import { useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';

import Button from 'components/common/Button';
import Wallet from 'components/Wallet';
import Overlay from 'components/Overlay';

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

function MobileNavbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { network, walletAddress, connect, disconnect } = useWeb3Context();

  const [open, setOpen] = useState<Boolean>(false);

  const router = useRouter();
  const { pathname } = router;

  function handleMenu() {
    setOpen((prev) => !prev);
  }

  const routes = [
    {
      pathname: '/pools',
      href: '/pools',
      name: translations[lang].pools
    },
    {
      pathname: '/assets/[id]',
      href: '/assets/dai',
      name: translations[lang].assets
    },
    {
      pathname: '/dashboard',
      href: '/dashboard',
      name: translations[lang].dashboard
    },
    { pathname: '/nerd-mode', href: '/', name: translations[lang].nerdMode }
  ];

  return (
    <>
      {open && <Overlay closeModal={handleMenu} />}
      <nav className={styles.navBar}>
        <div className={styles.wrapper}>
          <Link href="/">
            <img src="/img/logo.svg" alt="Exactly Logo" className={styles.logo} />
          </Link>
          {connect && !walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Conectar" onClick={connect} />
            </div>
          ) : (
            disconnect &&
            walletAddress && (
              <div className={styles.buttonContainer}>
                <Wallet
                  walletAddress={walletAddress}
                  cogwheel={false}
                  network={network}
                  disconnect={disconnect}
                />
              </div>
            )
          )}
          {!open ? (
            <img src="./img/icons/hamburger.svg" onClick={handleMenu} className={styles.icon} />
          ) : (
            <img src="./img/icons/close.svg" onClick={handleMenu} className={styles.icon} />
          )}
        </div>
      </nav>
      {open && (
        <ul className={styles.menu}>
          {routes.map((route) => {
            return (
              <li
                className={
                  route.pathname === pathname ? `${styles.link} ${styles.active}` : styles.link
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

import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import useProvider from 'hooks/useProvider';

import Button from 'components/common/Button';
import Wallet from 'components/Wallet';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';

type Props = {
  walletAddress?: String;
};

function Navbar({ walletAddress }: Props) {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { getProvider } = useProvider();
  const router = useRouter();
  const { pathname } = router;

  async function handleClick() {
    //this function generates the connection to the provider
    await getProvider();
  }

  const routes = [
    { pathname: '/', href: '/', name: translations[lang].markets },
    { pathname: '/assets', href: '/assets', name: translations[lang].assets },
    { pathname: '/dashboard', href: '/', name: translations[lang].dashboard },
    { pathname: '/nerd-mode', href: '/', name: translations[lang].nerdMode }
  ];

  return (
    <nav className={styles.navBar}>
      <div className={styles.wrapper}>
        <div className={styles.left}>
          <Link href="/">
            <img
              src="/img/logo.svg"
              alt="Exactly Logo"
              className={styles.logo}
            />
          </Link>
          <ul className={styles.linksContainer}>
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
        </div>
        <div className={styles.right}>
          {!walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Conectar" onClick={handleClick} />
            </div>
          ) : (
            <div className={styles.buttonContainer}>
              <Wallet walletAddress={walletAddress} />
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

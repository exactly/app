import Link from 'next/link';
import { useRouter } from 'next/router';
import styles from './style.module.scss';

import useProvider from 'hooks/useProvider';

import Button from 'components/common/Button';
import Wallet from 'components/Wallet';

type Props = {
  walletAddress?: String;
};

function Navbar({ walletAddress }: Props) {
  const { getProvider } = useProvider();
  const router = useRouter();
  const { pathname } = router;

  async function handleClick() {
    //this function generates the connection to the provider
    await getProvider();
  }

  const routes = [
    { pathname: '/', href: '/', name: 'Markets' },
    { pathname: '/assets', href: '/assets', name: 'Assets' },
    { pathname: '/dashboard', href: '/', name: 'Dashboard' },
    { pathname: '/nerd-mode', href: '/', name: 'Nerd Mode' }
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

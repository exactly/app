import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Button from 'components/common/Button';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

import styles from './style.module.scss';

import keys from './translations.json';

function NavbarHome() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const router = useRouter();
  const { pathname } = router;

  const routes = [
    {
      pathname: '/markets',
      href: '/markets',
      name: translations[lang].markets
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
    <nav className={styles.navBar}>
      <div className={styles.wrapper}>
        <div className={styles.left}>
          <Link href="/">
            <img src="/img/logo.png" alt="Exactly Logo" className={styles.logo} />
          </Link>
          <ul className={styles.linksContainer}>
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
        </div>
        <div className={styles.right}>
          <div className={styles.buttonContainer}>
            <Link href="/markets">
              <Button text={translations[lang].open} />
            </Link>
          </div>
        </div>
      </div>
    </nav>
  );
}

export default NavbarHome;

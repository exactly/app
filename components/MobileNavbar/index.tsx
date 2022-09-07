import { useState, useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import LangContext from 'contexts/LangContext';
import { useWeb3Context } from 'contexts/Web3Context';
import ThemeContext from 'contexts/ThemeContext';

const Button = dynamic(() => import('components/common/Button'));
const Wallet = dynamic(() => import('components/Wallet'));
const Overlay = dynamic(() => import('components/Overlay'));

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';

function MobileNavbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { network, walletAddress, connect, disconnect } = useWeb3Context();
  const { theme, changeTheme } = useContext(ThemeContext);

  const [open, setOpen] = useState<Boolean>(false);

  const router = useRouter();
  const { pathname } = router;

  function handleMenu() {
    setOpen((prev) => !prev);
  }

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
    }
    // { pathname: '/nerd-mode', href: '/', name: translations[lang].nerdMode }
  ];

  return (
    <>
      {open && <Overlay closeModal={handleMenu} />}
      <nav className={styles.navBar} style={open ? { zIndex: 7 } : {}}>
        <div className={styles.wrapper}>
          <Link href="/markets">
            <div className={styles.logo}>
              <Image
                src={theme == 'light' ? '/img/logo.png' : '/img/logo-white.png'}
                alt="Exactly Logo"
                layout="responsive"
                width={187}
                height={52}
                priority
              />
            </div>
          </Link>
          {connect && !walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Connect Wallet" onClick={connect} />
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
            <Image
              src="/img/icons/hamburger.svg"
              alt="hamburger"
              onClick={handleMenu}
              className={styles.icon}
              width={32}
              height={24}
            />
          ) : (
            <Image
              src="/img/icons/close.svg"
              alt="close"
              onClick={handleMenu}
              className={styles.icon}
              width={24}
              height={24}
            />
          )}
        </div>
        <a
          className={styles.discordFeedbackLink}
          target="_blank"
          rel="noreferrer noopener"
          href="https://discordapp.com/channels/846682395553824808/985912903880302632"
        >
          <strong>Give us feedback here!</strong>
        </a>
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
          <li className={styles.theme} onClick={changeTheme}>
            <Image
              src={theme == 'light' ? '/img/icons/moon.svg' : '/img/icons/sun.svg'}
              alt="theme toggler"
              width={16}
              height={16}
            />
          </li>
          {walletAddress && (
            <li className={styles.disconnect} onClick={() => disconnect && disconnect()}>
              <Image src="/img/icons/power.svg" alt="power" width={24} height={24} />
              {translations[lang].disconnect}
            </li>
          )}
        </ul>
      )}
    </>
  );
}

export default MobileNavbar;

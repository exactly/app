import { useState, useContext, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';

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
  const [image, setImage] = useState<string>('/img/logo.png');
  const [icon, setIcon] = useState<string>('/img/icons/moon.svg');

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

  useEffect(() => {
    if (document?.body?.dataset?.theme == 'dark') {
      setImage('/img/logo-white.png');
      setIcon('/img/icons/sun.svg');
    }
  }, []);

  function changeTheme() {
    if (document.body.dataset.theme == 'light') {
      document.body.dataset.theme = 'dark';
      setImage('/img/logo-white.png');
      setIcon('/img/icons/sun.svg');
      localStorage.setItem('theme', JSON.stringify('dark'));
    } else {
      document.body.dataset.theme = 'light';
      setImage('/img/logo.png');
      setIcon('/img/icons/moon.svg');
      localStorage.setItem('theme', JSON.stringify('light'));
    }
  }

  return (
    <>
      {open && <Overlay closeModal={handleMenu} />}
      <nav className={styles.navBar} style={open ? { zIndex: 7 } : {}}>
        <div className={styles.wrapper}>
          <Link href="/markets">
            <div className={styles.logo}>
              <Image
                src={image}
                alt="Exactly Logo"
                layout="responsive"
                width={5986}
                height={1657}
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
            <Image src={icon} width={16} height={16} />
          </li>
          {walletAddress && (
            <li className={styles.disconnect} onClick={() => disconnect && disconnect()}>
              <Image src="/img/icons/power.svg" width={24} height={24} />
              {translations[lang].disconnect}
            </li>
          )}
        </ul>
      )}
    </>
  );
}

export default MobileNavbar;

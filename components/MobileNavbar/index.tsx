import React, { useState, useContext } from 'react';
import { useConnect, useDisconnect } from 'wagmi';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import dynamic from 'next/dynamic';

import LangContext from 'contexts/LangContext';
import ThemeContext from 'contexts/ThemeContext';

const Button = dynamic(() => import('components/common/Button'));
const Wallet = dynamic(() => import('components/Wallet'));
const Overlay = dynamic(() => import('components/Overlay'));

import { LangKeys } from 'types/Lang';

import styles from './style.module.scss';

import keys from './translations.json';
import { useWeb3 } from 'hooks/useWeb3';

function MobileNavbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { walletAddress } = useWeb3();
  const { disconnect } = useDisconnect();
  const { connect } = useConnect();
  const { theme } = useContext(ThemeContext);
  const { pathname, query } = useRouter();

  const [open, setOpen] = useState<boolean>(false);

  function handleMenu() {
    setOpen((prev) => !prev);
  }

  const routes = [
    { pathname: '/', name: translations[lang].markets },
    { pathname: '/dashboard', name: translations[lang].dashboard },
  ];

  return (
    <>
      {open && <Overlay close={handleMenu} />}
      <nav className={styles.navBar} style={open ? { zIndex: 7 } : {}}>
        <div className={styles.wrapper}>
          <Link href={{ pathname: '/', query }}>
            <div className={styles.logo}>
              <Image
                src={theme === 'light' ? '/img/logo.png' : '/img/logo-white.png'}
                alt="Exactly Logo"
                layout="responsive"
                width={187}
                height={52}
                priority
              />
            </div>
          </Link>
          {!walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Connect Wallet" onClick={() => connect()} />
            </div>
          ) : (
            <>
              <a
                className={styles.discordFeedbackLink}
                target="_blank"
                rel="noreferrer noopener"
                href="https://discord.com/channels/846682395553824808/908758791057719358"
              >
                <strong>Feedback here</strong>
              </a>
              <div className={styles.buttonContainer}>
                <Wallet walletAddress={walletAddress} cogwheel={false} />
              </div>
            </>
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
      </nav>
      {open && (
        <ul className={styles.menu}>
          {routes.map((route) => {
            return (
              <li
                className={route.pathname === pathname ? `${styles.link} ${styles.active}` : styles.link}
                key={route.pathname}
              >
                <Link href={{ pathname: route.pathname, query }}>{route.name}</Link>
              </li>
            );
          })}
          {/* <li className={styles.theme} onClick={changeTheme}>
            <Image
              src={theme === 'light' ? '/img/icons/moon.svg' : '/img/icons/sun.svg'}
              alt="theme toggler"
              width={16}
              height={16}
            />
          </li> */}
          {walletAddress && (
            <li className={styles.disconnect} onClick={() => disconnect()}>
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

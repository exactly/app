import React, { useContext, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('components/common/Button'));
const Wallet = dynamic(() => import('components/Wallet'));
import DisclaimerModal from 'components/DisclaimerModal';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import ThemeContext from 'contexts/ThemeContext';
import { useWeb3Context } from 'contexts/Web3Context';
import ModalStatusContext from 'contexts/ModalStatusContext';

import styles from './style.module.scss';

import keys from './translations.json';

import allowedNetworks from 'config/allowedNetworks.json';
import analytics from 'utils/analytics';

function Navbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { web3Provider, connect, disconnect, walletAddress, network } = useWeb3Context();

  const { theme } = useContext(ThemeContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);

  const router = useRouter();

  const { pathname } = router;

  useEffect(() => {
    walletAddress && void analytics.identify(walletAddress);
  }, [walletAddress]);

  const routes = useMemo(
    () => [
      {
        pathname: '/markets',
        href: '/markets',
        name: translations[lang].markets,
      },
      {
        pathname: '/dashboard',
        href: '/dashboard',
        name: translations[lang].dashboard,
      },
    ],
    [lang, translations],
  );

  const isAllowed = useMemo(() => network && allowedNetworks.includes(network.name), [network]);

  async function handleFaucetClick() {
    if (!web3Provider?.provider.request) return;

    if (isAllowed && network?.name === 'goerli') {
      setOperation('faucet');
      setOpen(true);
      return;
    }

    if (!isAllowed) {
      await web3Provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: '0x1',
          },
        ],
      });
    }
  }

  return (
    <nav className={styles.navBar}>
      <div className={styles.wrapper}>
        <DisclaimerModal />
        <div className={styles.left}>
          <Link href="/markets">
            <div className={styles.logo}>
              <Image
                src={theme === 'light' ? '/img/logo.png' : '/img/logo-white.png'}
                alt="Exactly Logo"
                layout="responsive"
                width={187}
                height={52}
              />
            </div>
          </Link>

          {network?.chainId === 5 && ( // TODO: put chainId constants in a config file
            <div className={styles.faucet} onClick={handleFaucetClick}>
              <p>Goerli Faucet</p>
            </div>
          )}

          <div className={styles.center}>
            <ul className={styles.linksContainer}>
              {routes.map((route) => {
                return (
                  <li
                    className={route.pathname === pathname ? `${styles.link} ${styles.active}` : styles.link}
                    key={route.pathname}
                  >
                    <Link href={route.href}>{route.name}</Link>
                  </li>
                );
              })}
            </ul>
          </div>
        </div>

        <div className={styles.right}>
          <a
            className={styles.discordFeedbackLink}
            target="_blank"
            rel="noreferrer noopener"
            href="https://discord.com/channels/846682395553824808/908758791057719358"
          >
            <strong>Feedback here!</strong>
          </a>
          <a
            className={styles.discordFeedbackLink}
            target="_blank"
            rel="noreferrer noopener"
            href="https://docs.exact.ly/"
          >
            <strong>Docs</strong>
          </a>
          {network && isAllowed && (
            <div className={styles.networkContainer} onClick={handleFaucetClick}>
              <div className={styles.dot} />
              <p className={styles.network}>
                {translations[lang].connectedTo} {network?.name === 'homestead' ? 'mainnet' : network?.name}
                {/* HACK - move to chainIds */}
              </p>
            </div>
          )}

          {network && !isAllowed && (
            <div className={styles.networkContainer} onClick={handleFaucetClick}>
              <div className={styles.dotError} />
              <p className={styles.network}>{translations[lang].clickHere}</p>
            </div>
          )}

          {!network && (
            <div className={styles.networkContainer} onClick={handleFaucetClick}>
              <div className={styles.dotError} />
              <p className={styles.network}>{translations[lang].disconnected}</p>
            </div>
          )}

          {connect && !walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Connect Wallet" onClick={connect} />
            </div>
          ) : (
            disconnect &&
            walletAddress && (
              <div className={styles.buttonContainer}>
                <Wallet walletAddress={walletAddress} disconnect={disconnect} />
              </div>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

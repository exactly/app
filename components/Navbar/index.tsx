import React, { useContext, useEffect, useMemo } from 'react';
import { useSwitchNetwork } from 'wagmi';
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
import ModalStatusContext from 'contexts/ModalStatusContext';

import styles from './style.module.scss';

import keys from './translations.json';

import allowedNetworks from 'config/allowedNetworks.json';
import analytics from 'utils/analytics';
import { useWeb3 } from 'hooks/useWeb3';

function Navbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;
  const { switchNetworkAsync } = useSwitchNetwork();
  const { chain } = useWeb3();
  const { pathname, query } = useRouter();

  const { connect, disconnect, walletAddress } = useWeb3();

  const { theme } = useContext(ThemeContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);

  useEffect(() => {
    walletAddress && void analytics.identify(walletAddress);
  }, [walletAddress]);

  const routes = useMemo(
    () => [
      { pathname: '/', name: translations[lang].markets },
      { pathname: '/dashboard', name: translations[lang].dashboard },
    ],
    [lang, translations],
  );

  const isAllowed = useMemo(() => chain && allowedNetworks.includes(chain.network), [chain]);

  async function handleFaucetClick() {
    if (isAllowed && chain?.network === 'goerli') {
      setOperation('faucet');
      setOpen(true);
      return;
    }

    if (!isAllowed) await switchNetworkAsync?.(5);
  }

  return (
    <nav className={styles.navBar}>
      <div className={styles.wrapper}>
        <DisclaimerModal />
        <div className={styles.left}>
          <Link href={{ pathname: '/', query }}>
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

          {chain?.id === 5 && ( // TODO: put chainId constants in a config file
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
                    <Link href={{ pathname: route.pathname, query }}>{route.name}</Link>
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
          {chain && isAllowed && (
            <div className={styles.networkContainer} onClick={handleFaucetClick}>
              <div className={styles.dot} />
              <p className={styles.network}>
                {translations[lang].connectedTo} {chain?.network === 'homestead' ? 'mainnet' : chain?.network}
                {/* HACK - move to chainIds */}
              </p>
            </div>
          )}

          {chain && !isAllowed && (
            <div className={styles.networkContainer} onClick={handleFaucetClick}>
              <div className={styles.dotError} />
              <p className={styles.network}>{translations[lang].clickHere}</p>
            </div>
          )}

          {!chain && (
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

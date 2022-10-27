import { useContext, useMemo } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('components/common/Button'));
const Wallet = dynamic(() => import('components/Wallet'));

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import ThemeContext from 'contexts/ThemeContext';
import { useWeb3Context } from 'contexts/Web3Context';
import ModalStatusContext from 'contexts/ModalStatusContext';

import styles from './style.module.scss';

import keys from './translations.json';

import allowedNetworks from 'config/allowedNetworks.json';

function Navbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { web3Provider, connect, disconnect, walletAddress, network } = useWeb3Context();

  const { theme } = useContext(ThemeContext);
  const { setOpen, setOperation } = useContext(ModalStatusContext);

  const router = useRouter();

  const { pathname } = router;

  const routes = useMemo(() => {
    return [
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
    ];
  }, []);

  const isAllowed = useMemo(() => {
    return network && allowedNetworks.includes(network?.name);
  }, [network, allowedNetworks]);

  async function handleClick() {
    if (!isAllowed) {
      if (!web3Provider?.provider.request) return;

      await web3Provider.provider.request({
        method: 'wallet_switchEthereumChain',
        params: [
          {
            chainId: '0x5',
          },
        ],
      });
    } else if (isAllowed && network?.name === 'goerli') {
      setOperation('faucet');
      setOpen(true);
    }
  }

  return (
    <nav className={styles.navBar}>
      <div className={styles.wrapper}>
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
        </div>
        <div className={styles.faucet} onClick={handleClick}>
          <p>Goerli Faucet</p>
        </div>

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
        <a
          className={styles.discordFeedbackLink}
          target="_blank"
          rel="noreferrer noopener"
          href="https://discordapp.com/channels/846682395553824808/985912903880302632"
        >
          <strong>Give us feedback here!</strong>
        </a>

        <div className={styles.right}>
          {network && isAllowed && (
            <div className={styles.networkContainer} onClick={handleClick}>
              <div className={styles.dot} />
              <p className={styles.network}>
                {translations[lang].connectedTo} {network?.name}
              </p>
            </div>
          )}

          {network && !isAllowed && (
            <div className={styles.networkContainer} onClick={handleClick}>
              <div className={styles.dotError} />
              <p className={styles.network}>{translations[lang].clickHere}</p>
            </div>
          )}

          {!network && (
            <div className={styles.networkContainer} onClick={handleClick}>
              <div className={styles.dotError} />
              <p className={styles.network}>{translations[lang].disconnected}</p>
            </div>
          )}

          {connect && !walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Connect Wallet" onClick={() => connect()} />
            </div>
          ) : (
            disconnect &&
            walletAddress && (
              <div className={styles.buttonContainer}>
                <Wallet walletAddress={walletAddress} disconnect={() => disconnect()} />
              </div>
            )
          )}
          {/* <div className={styles.theme}>
            <Image
              src={theme === 'light' ? '/img/icons/moon.svg' : '/img/icons/sun.svg'}
              alt="theme toggler"
              width={16}
              height={16}
              onClick={changeTheme}
            />
          </div> */}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

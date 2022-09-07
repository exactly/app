import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';
import Image from 'next/image';
import dynamic from 'next/dynamic';

const Button = dynamic(() => import('components/common/Button'));
const Wallet = dynamic(() => import('components/Wallet'));

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';
import ThemeContext from 'contexts/ThemeContext';

import styles from './style.module.scss';

import keys from './translations.json';
import { useWeb3Context } from 'contexts/Web3Context';
import FixedLenderContext from 'contexts/FixedLenderContext';
import { getSymbol } from 'utils/utils';

function Navbar() {
  const lang: string = useContext(LangContext);
  const translations: { [key: string]: LangKeys } = keys;

  const { connect, disconnect, walletAddress, network } = useWeb3Context();
  const fixedLenderData = useContext(FixedLenderContext);

  const { theme, changeTheme } = useContext(ThemeContext);

  const router = useRouter();

  const { pathname } = router;

  const assetsRoutes: { href: string; name: string }[] = fixedLenderData.map((asset) => {
    const address = asset.address;
    const assetSymbol =
      getSymbol(address!, network?.name) == 'WETH' ? 'ETH' : getSymbol(address!, network?.name);

    return {
      href: `/assets/${assetSymbol}`.toLowerCase(),
      name: assetSymbol,
      image:
        assetSymbol == 'ETH'
          ? `/img/assets/weth.svg`
          : `/img/assets/${assetSymbol.toLowerCase()}.svg`
    };
  });

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
    <nav className={styles.navBar}>
      <div className={styles.wrapper}>
        <div className={styles.left}>
          <Link href="/markets">
            <div className={styles.logo}>
              <Image
                src={theme == 'light' ? '/img/logo.png' : '/img/logo-white.png'}
                alt="Exactly Logo"
                layout="responsive"
                width={187}
                height={52}
              />
            </div>
          </Link>
          <ul className={styles.linksContainer}>
            {routes.map((route) => {
              if (route.pathname === '/assets/[id]') {
                return (
                  <li
                    className={`${styles.assetLink} 
                     ${
                       route.pathname === pathname ? `${styles.link} ${styles.active}` : styles.link
                     }
                    `}
                    key={route.pathname}
                  >
                    {assetsRoutes.length > 0 ? (
                      <div className={styles.dropdown}>
                        <p className={styles.assetsTitle}>{translations[lang].assets}</p>
                        <Image
                          src={`/img/icons/arrowDown.svg`}
                          alt="assets"
                          width={12}
                          height={7}
                          priority
                        />
                        <div className={styles.dropdownContent}>
                          {assetsRoutes.map((asset: any) => {
                            return (
                              <Link href={asset.href} key={asset.name}>
                                <div className={styles.asset}>
                                  <Image
                                    src={asset.image}
                                    alt={asset.name}
                                    width={20}
                                    height={20}
                                  />{' '}
                                  <p className={styles.assetName}>{asset.name}</p>
                                </div>
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dropdown}>
                          <Link href="assets/dai">{translations[lang].assets}</Link>
                          <Image
                            src={`/img/icons/arrowDown.svg`}
                            alt="assets"
                            width={12}
                            height={7}
                          />
                        </div>
                      </>
                    )}
                  </li>
                );
              } else {
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
              }
            })}
          </ul>
        </div>

        <div className={styles.right}>
          <a
            className={styles.discordFeedbackLink}
            target="_blank"
            rel="noreferrer noopener"
            href="https://discordapp.com/channels/846682395553824808/985912903880302632"
          >
            <strong>Give us feedback here!</strong>
          </a>

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
          <div className={styles.theme}>
            <Image
              src={theme == 'light' ? '/img/icons/moon.svg' : '/img/icons/sun.svg'}
              alt="theme toggler"
              width={16}
              height={16}
              onClick={changeTheme}
            />
          </div>
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

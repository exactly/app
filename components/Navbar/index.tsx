import { useContext } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/router';

import Button from 'components/common/Button';
import Wallet from 'components/Wallet';

import { LangKeys } from 'types/Lang';

import LangContext from 'contexts/LangContext';

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

  const router = useRouter();
  const { pathname } = router;

  const assetsRoutes: { href: string; name: string }[] = fixedLenderData.map((asset) => {
    const address = asset.address;
    const assetSymbol =
      getSymbol(address!, network?.name) == 'WETH' ? 'ETH' : getSymbol(address!, network?.name);

    return {
      href: `/assets/${assetSymbol}`.toLowerCase(),
      name: assetSymbol
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
            <img src="/img/logo.png" alt="Exactly Logo" className={styles.logo} />
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
                        <img src={`/img/icons/arrowDown.svg`} alt="assets" />
                        <div className={styles.dropdownContent}>
                          {assetsRoutes.map((asset: any) => {
                            return (
                              <Link href={asset.href} key={asset.name}>
                                {asset.name}
                              </Link>
                            );
                          })}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className={styles.dropdown}>
                          <Link href="assets/dai">{translations[lang].assets}</Link>
                          <img src={`/img/icons/arrowDown.svg`} alt="assets" />
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
          {connect && !walletAddress ? (
            <div className={styles.buttonContainer}>
              <Button text="Connect Wallet" onClick={() => connect()} />
            </div>
          ) : (
            disconnect &&
            walletAddress && (
              <>
                <a
                  className={styles.discordFeedbackLink}
                  target="_blank"
                  rel="noreferrer noopener"
                  href="https://discordapp.com/channels/846682395553824808/985912903880302632"
                >
                  <strong>Give us feedback here!</strong>
                </a>
                <div className={styles.buttonContainer}>
                  <Wallet walletAddress={walletAddress} disconnect={() => disconnect()} />
                </div>
              </>
            )
          )}
        </div>
      </div>
    </nav>
  );
}

export default Navbar;

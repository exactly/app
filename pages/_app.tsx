import { useState, useEffect } from 'react';

import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';

import { getChainId } from 'utils/utils';
import { AddressProvider } from 'contexts/AddressContext';

import { getCurrentWalletConnected } from 'hooks/useWallet';
import { LangProvider } from 'contexts/LangContext';
import { Dictionary } from 'types/Dictionary';

import { useRouter } from 'next/router';

function MyApp({ Component, pageProps }: AppProps) {
  const [walletAddress, setWallet] = useState<string | undefined>(undefined);
  const [network, setNetwork] = useState<string | undefined>(undefined);
  const router = useRouter();

  useEffect(() => {
    getNetwork();
    handleWallet();
    addWalletListener();

    window.ethereum.on('chainChanged', () => {
      router.reload();
    });
  }, []);

  async function getNetwork() {
    const chainId = await getChainId();

    const chainMap: Dictionary<string> = {
      '0x1': 'Mainnet',
      '0x4': 'Rinkeby',
      '0x2a': 'Kovan'
    };

    setNetwork(chainMap[chainId] ?? undefined);
  }

  async function handleWallet() {
    //this function gets the wallet address
    const { address } = await getCurrentWalletConnected();
    setWallet(address);
  }

  function addWalletListener() {
    //we listen to any change in wallet
    if (window.ethereum) {
      window.ethereum.on('accountsChanged', (accounts: any) => {
        if (accounts.length > 0) {
          setWallet(accounts[0]);
        } else {
          setWallet(undefined);
        }
      });
    }
  }

  const props = { ...pageProps, walletAddress, network };

  return (
    <>
      <Head>
        <title>
          Exactly App - Fixed interest rates lending & borrowing protocol
        </title>
        <meta
          name="description"
          content="Exactly App - Fixed interest rates lending & borrowing protocol"
        />
        <link rel="icon" href="/icon.ico" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin="true"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Source+Sans+Pro:ital,wght@0,200;0,300;0,400;0,600;0,700;0,900;1,200;1,300;1,400;1,600;1,700;1,900&display=swap"
          rel="stylesheet"
        ></link>
      </Head>
      <LangProvider value={'en'}>
        <AddressProvider>
          <Component {...props} />
        </AddressProvider>
      </LangProvider>
    </>
  );
}

export default MyApp;

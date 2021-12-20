import { useState, useEffect } from 'react';

import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';

import { AddressProvider } from 'contexts/AddressContext';
import { AlertProvider } from 'contexts/AlertContext';

import { getCurrentWalletConnected } from 'hooks/useWallet';
import useNetwork from 'hooks/useNetwork';

function MyApp({ Component, pageProps }: AppProps) {
  const [walletAddress, setWallet] = useState<string | undefined>(undefined);
  const network = useNetwork();

  useEffect(() => {
    handleWallet();
    addWalletListener();
  }, []);

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
      window.ethereum.on('message', (message) => {
        console.log(message, 1);
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
      </Head>
      <AddressProvider>
        <AlertProvider>
          <Component {...props} />
        </AlertProvider>
      </AddressProvider>
    </>
  );
}

export default MyApp;

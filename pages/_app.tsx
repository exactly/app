import { useState, useEffect } from 'react';

import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';

import { getContractsByEnv } from 'utils/utils';
import { AddressProvider } from 'contexts/AddressContext';

import { getCurrentWalletConnected } from 'hooks/useWallet';
import useNetwork from 'hooks/useNetwork';
import { LangProvider } from 'contexts/LangContext';

function MyApp({ Component, pageProps }: AppProps) {
  const [walletAddress, setWallet] = useState<string | undefined>(undefined);
  const network = useNetwork();

  useEffect(() => {
    handleWallet();
    addWalletListener();
  }, []);

  function getContractByEnv() {
    const contracts = getContractsByEnv();
    return contracts;
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
      </Head>
      <LangProvider value={"en"}>
        <AddressProvider>
          <Component {...props} />
        </AddressProvider>
      </LangProvider>
    </>
  );
}

export default MyApp;

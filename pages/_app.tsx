import { useState, useEffect } from 'react';

import '../styles/globals.css';
import '../styles/variables.css';

import type { AppProps } from 'next/app';
import Head from 'next/head';

import { getContractsByEnv } from 'utils/utils';
import { ContractProvider } from 'contexts/ContractContext';

import { getCurrentWalletConnected } from 'hooks/useWallet';
import useNetwork from 'hooks/useNetwork';

function MyApp({ Component, pageProps }: AppProps) {
  const [walletAddress, setWallet] = useState('');
  const network = useNetwork();

  useEffect(() => {
    handleWallet();
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
      <ContractProvider value={getContractByEnv()}>
        <Component {...props} />
      </ContractProvider>
    </>
  );
}

export default MyApp;

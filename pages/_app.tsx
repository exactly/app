import '../styles/globals.css';
import '../styles/variables.css';
import type { AppProps } from 'next/app';
import Head from 'next/head';
import { getContractsByEnv } from 'utils/utils';
import { ContractProvider } from 'contexts/ContractContext';

function MyApp({ Component, pageProps }: AppProps) {
  function getContractByEnv() {
    const contracts = getContractsByEnv();
    return contracts;
  }

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
        <Component {...pageProps} />
      </ContractProvider>
    </>
  );
}
export default MyApp;

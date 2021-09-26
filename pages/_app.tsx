import "../styles/globals.css";
import "../styles/variables.css";
import type { AppProps } from "next/app";
import { getContractsByEnv } from "utils/utils";
import { ContractProvider } from "contexts/ContractContext";

function MyApp({ Component, pageProps }: AppProps) {
  function getContractByEnv() {
    const contracts = getContractsByEnv();
    return contracts;
  }

  return (
    <ContractProvider value={getContractByEnv()}>
      <Component {...pageProps} />
    </ContractProvider>
  );
}
export default MyApp;

import { ethers } from "ethers";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function useProvider() {
  // const [web3Provider, setWeb3Provider] =
  //   useState<ethers.providers.Web3Provider>();
  const [alchemyProvider, setAlchemyProvider] =
    useState<ethers.providers.AlchemyProvider>();

  useEffect(() => {
    getProvider();
  }, []);

  async function getProvider() {
    // await window.ethereum.enable();
    // const web3Provider = new ethers.providers.Web3Provider(
    //   window.ethereum,
    //   "any"
    // );

    const alchemyProvider = await new ethers.providers.AlchemyProvider(
      "rinkeby"
    );

    // setWeb3Provider(web3Provider);
    setAlchemyProvider(alchemyProvider);
  }

  return alchemyProvider;
}

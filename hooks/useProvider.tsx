import { ethers } from "ethers";
import { useEffect, useState } from "react";

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function useProvider() {
  const [provider, setProvider] = useState<ethers.providers.Web3Provider>();

  useEffect(() => {
    getProvider();
  }, []);

  async function getProvider() {
    await window.ethereum.enable();
    const provider = new ethers.providers.Web3Provider(window.ethereum, "any");

    setProvider(provider);
  }

  return provider;
}

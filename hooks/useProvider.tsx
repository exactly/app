import { ethers } from 'ethers';
import { useState } from 'react';

declare global {
  interface Window {
    ethereum: any;
  }
}

export default function useProvider() {
  const [web3Provider, setWeb3Provider] =
    useState<ethers.providers.Web3Provider>();

  async function getProvider() {
    await window?.ethereum?.request({ method: 'eth_requestAccounts' });
    const web3Provider = new ethers.providers.Web3Provider(
      window.ethereum,
      'any'
    );
    setWeb3Provider(web3Provider);
  }

  return { web3Provider, getProvider };
}

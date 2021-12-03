import { Network } from '@ethersproject/networks';
import { useEffect, useState } from 'react';
import useProvider from './useProvider';

function useNetwork() {
  const { web3Provider, getProvider } = useProvider();
  const [network, setNetwork] = useState<Network | undefined>(undefined);

  useEffect(() => {
    if (window.ethereum) {
      window.ethereum.on('chainChanged', () => {
        getProvider();
      });
    }
  }, []);

  useEffect(() => {
    getProvider();
  }, []);

  useEffect(() => {
    getNetwork();
  }, [web3Provider]);

  async function getNetwork() {
    const network = await web3Provider?.getNetwork();
    setNetwork(network);
  }

  return network;
}

export default useNetwork;

import { useMemo, useCallback } from 'react';
import { Chain, useAccount, useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react';
import { supportedChains } from 'utils/chain';
import useDebounce from './useDebounce';
import { useNetworkContext } from 'contexts/NetworkContext';
import { getQueryParam } from 'utils/getQueryParam';

type Web3 = {
  connect: () => void;
  isConnected: boolean;
  walletAddress?: `0x${string}`;
  chains: Chain[];
  chain: Chain;
};

const isValidAddress = (address: string | undefined) => {
  return address && /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
};

export const useWeb3 = (): Web3 => {
  const { address } = useAccount();
  const { displayNetwork } = useNetworkContext();

  const currentAddress: `0x${string}` | undefined = useMemo(() => {
    const param = getQueryParam('account');
    const account = isValidAddress(param) ? (param as `0x${string}`) : undefined;
    return account || address;
  }, [address]);

  const walletAddress = useDebounce(currentAddress, 50);

  const { open } = useWeb3Modal();

  const { connectors, connect } = useConnect();

  const connectWallet = useCallback(() => {
    if (JSON.parse(process.env.NEXT_PUBLIC_IS_E2E ?? 'false')) {
      const injected = connectors.find(({ id, ready, name }) => ready && id === 'injected' && name === 'E2E');
      connect({ connector: injected });
    } else {
      open({ route: 'ConnectWallet' });
    }
  }, [open, connect, connectors]);

  return {
    connect: connectWallet,
    isConnected: !!walletAddress,
    walletAddress,
    chains: supportedChains,
    chain: displayNetwork,
  };
};

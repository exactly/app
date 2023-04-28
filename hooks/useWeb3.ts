import { useMemo, useCallback } from 'react';
import { Chain, useAccount, useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react';
import { isE2E, supportedChains } from 'utils/client';
import useDebounce from './useDebounce';
import { useNetworkContext } from 'contexts/NetworkContext';
import useRouter from './useRouter';

type Web3 = {
  connect: () => void;
  isConnected: boolean;
  impersonateActive: boolean;
  exitImpersonate: () => void;
  walletAddress?: `0x${string}`;
  chains: Chain[];
  chain: Chain;
};

const isValidAddress = (address: string | undefined): address is `0x${string}` => {
  return !!address && /^(0x){1}[0-9a-fA-F]{40}$/i.test(address);
};

export const useWeb3 = (): Web3 => {
  const { query, replace } = useRouter();
  const { address } = useAccount();
  const { displayNetwork } = useNetworkContext();

  const [currentAddress, impersonateActive] = useMemo((): [`0x${string}` | undefined, boolean] => {
    const { account } = query;
    const isImpersonating = !(account instanceof Array) && isValidAddress(account);
    return [isImpersonating ? account : address, isImpersonating];
  }, [address, query]);

  const exitImpersonate = useCallback(async () => {
    const { account, ...rest } = query;
    await replace({ query: rest });
  }, [query, replace]);

  const walletAddress = useDebounce(currentAddress, 50);

  const { open } = useWeb3Modal();

  const { connectors, connect } = useConnect();

  const connectWallet = useCallback(() => {
    if (isE2E) {
      const injected = connectors.find(({ id, ready, name }) => ready && id === 'injected' && name === 'E2E');
      connect({ connector: injected });
    } else {
      open({ route: 'ConnectWallet' });
    }
  }, [open, connect, connectors]);

  return {
    connect: connectWallet,
    isConnected: !!walletAddress,
    impersonateActive,
    exitImpersonate,
    walletAddress,
    chains: supportedChains,
    chain: displayNetwork,
  };
};

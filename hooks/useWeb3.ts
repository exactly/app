import { useMemo, useCallback } from 'react';
import { isAddress } from 'viem';
import { Address, Chain, useAccount, useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/wagmi/react';
import { isE2E, defaultChain } from 'utils/client';
import useRouter from './useRouter';
import networkData from 'config/networkData.json' assert { type: 'json' };

type Web3 = {
  connect: () => void;
  isConnected: boolean;
  impersonateActive: boolean;
  exitImpersonate: () => void;
  walletAddress?: Address;
  chain: Chain;
  subgraphURL?: string;
  opts?: {
    account: Address;
    chain: Chain;
  };
};

const subgraphURL = networkData[String(defaultChain.id) as keyof typeof networkData]?.subgraph.exactly;

export const useWeb3 = (): Web3 => {
  const { query, replace } = useRouter();
  const { connector, address, isConnected } = useAccount();

  const [walletAddress, impersonateActive] = useMemo((): [Address | undefined, boolean] => {
    const { account } = query;
    if (!account) return [address, false];
    const isImpersonating = !(account instanceof Array) && isAddress(account);
    return [isImpersonating ? account : address, isImpersonating];
  }, [address, query]);

  const exitImpersonate = useCallback(async () => {
    const { account, ...rest } = query;
    await replace({ query: rest });
  }, [query, replace]);

  const { open } = useWeb3Modal();

  const { connectors, connect } = useConnect();

  const connectWallet = useCallback(() => {
    if (isE2E) {
      const injected = connectors.find(({ id, ready, name }) => ready && id === 'mock' && name === 'Mock');
      connect({ connector: injected, chainId: defaultChain.id });
    } else {
      open({ view: 'Connect' });
    }
  }, [open, connect, connectors]);

  const opts = useMemo(
    () =>
      walletAddress
        ? { account: walletAddress, chain: defaultChain, ...(connector?.id === 'safe' ? { value: 0n } : {}) }
        : undefined,
    [walletAddress, connector?.id],
  );

  return {
    connect: connectWallet,
    isConnected,
    impersonateActive,
    exitImpersonate,
    walletAddress,
    chain: defaultChain,
    subgraphURL,
    opts,
  };
};

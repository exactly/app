import { useMemo, useCallback } from 'react';
import { isAddress } from 'viem';
import { Address, Chain, useAccount, useConnect } from 'wagmi';
import { useWeb3Modal } from '@web3modal/react';
import { isE2E, supportedChains } from 'utils/client';
import { optimism } from 'wagmi/chains';
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

export const useWeb3 = (): Web3 => {
  const { query, replace } = useRouter();
  const { connector, address, isConnected } = useAccount();

  const networkId = Number(process.env.NEXT_PUBLIC_NETWORK);
  const displayNetwork = supportedChains.find((c) => c.id === networkId) ?? optimism;

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
      const injected = connectors.find(({ id, ready, name }) => ready && id === 'injected' && name === 'E2E');
      connect({ connector: injected });
    } else {
      open({ route: 'ConnectWallet' });
    }
  }, [open, connect, connectors]);

  const opts = useMemo(
    () =>
      walletAddress
        ? connector?.id === 'safe'
          ? { account: walletAddress, chain: displayNetwork, value: 0n }
          : { account: walletAddress, chain: displayNetwork }
        : undefined,
    [walletAddress, connector?.id, displayNetwork],
  );

  const subgraphURL = networkData[String(displayNetwork.id) as keyof typeof networkData]?.subgraph;

  return {
    connect: connectWallet,
    isConnected,
    impersonateActive,
    exitImpersonate,
    walletAddress,
    chain: displayNetwork,
    subgraphURL,
    opts,
  };
};

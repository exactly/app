import { InjectedConnector } from 'wagmi/connectors/injected';
import { useAccount, useConnect, useDisconnect, useNetwork } from 'wagmi';
import { useRouter } from 'next/router';
import * as chains from 'wagmi/chains';
import useDebounce from './useDebounce';

export const useWeb3 = () => {
  const { connect } = useConnect({ connector: new InjectedConnector() });
  const { disconnect } = useDisconnect();
  const { address, isConnected } = useAccount();
  const { chain } = useNetwork();
  const { query } = useRouter();

  const walletAddress = useDebounce(address);
  return {
    isConnected,
    walletAddress,
    chain: walletAddress
      ? chain
      : chains[(typeof query.n === 'string' ? query.n : process.env.NEXT_PUBLIC_NETWORK) as keyof typeof chains],
    connect,
    disconnect,
  };
};

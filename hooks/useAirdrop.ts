import { zeroAddress } from 'viem';

import { useWeb3 } from './useWeb3';
import {
  airdropABI,
  usePrepareAirdropClaim as _usePrepareAirdropClaim,
  useAirdropClaimed as _useAirdropClaimed,
} from 'types/abi';
import useContract from './useContract';

export const useAirdrop = () => {
  return useContract('Airdrop', airdropABI);
};

export const usePrepareAirdropClaim = (args?: Parameters<typeof _usePrepareAirdropClaim>[0]) => {
  const { chain, walletAddress } = useWeb3();
  const airdrop = useAirdrop();

  return _usePrepareAirdropClaim({
    ...args,
    account: walletAddress ?? zeroAddress,
    chainId: chain.id,
    address: airdrop?.address,
  });
};

export const useAirdropClaimed = (args?: { watch?: boolean }) => {
  const { chain, walletAddress } = useWeb3();
  const airdrop = useAirdrop();

  return _useAirdropClaimed({
    ...args,
    chainId: chain.id,
    address: airdrop?.address,
    args: [walletAddress ?? zeroAddress],
  });
};

import { useWeb3 } from './useWeb3';
import { zeroAddress } from 'viem';

import {
  protoStakerABI,
  usePrepareProtoStakerStakeBalance as _usePrepareProtoStakerStakeBalance,
  useProtoStakerPreviewEth as _useProtoStakerPreviewETH,
} from 'types/abi';
import useContract from './useContract';

export const useProtoStaker = () => {
  return useContract('ProtoStaker', protoStakerABI);
};

export const useProtoStakerPreviewETH = (exa: bigint) => {
  const { chain, walletAddress } = useWeb3();
  const protoStaker = useProtoStaker();

  return _useProtoStakerPreviewETH({
    account: walletAddress ?? zeroAddress,
    chainId: chain.id,
    address: protoStaker?.address,
    args: [exa],
  });
};

export const usePrepareProtoStakerStakeBalance = (
  args: Parameters<typeof _usePrepareProtoStakerStakeBalance>[0] & { value: bigint },
) => {
  const { chain, walletAddress } = useWeb3();
  const protoStaker = useProtoStaker();

  return _usePrepareProtoStakerStakeBalance({
    account: walletAddress ?? zeroAddress,
    chainId: chain.id,
    address: protoStaker?.address,
    ...args,
  });
};

import { useWeb3 } from './useWeb3';
import {
  sablierV2NftDescriptorABI,
  sablierV2LockupLinearABI,
  useSablierV2LockupLinearWithdrawableAmountOf as _useSablierV2LockupLinearWithdrawableAmountOf,
  usePrepareSablierV2LockupLinearWithdrawMax as _usePrepareSablierV2LockupLinearWithdrawMax,
  useSablierV2LockupLinearGetWithdrawnAmount as _useSablierV2LockupLinearGetWithdrawnAmount,
  useSablierV2NftDescriptorTokenUri as _useSablierV2NftDescriptorTokenUri,
} from 'types/abi';
import useContract from './useContract';

export const useSablierV2NFTDescriptor = () => {
  return useContract('SablierV2NFTDescriptor', sablierV2NftDescriptorABI);
};

export const useSablierV2LockupLinear = () => {
  return useContract('SablierV2LockupLinear', sablierV2LockupLinearABI);
};

export const useSablierV2LockupLinearWithdrawableAmountOf = (stream?: bigint) => {
  const { chain } = useWeb3();
  const sablier = useSablierV2LockupLinear();

  return _useSablierV2LockupLinearWithdrawableAmountOf({
    chainId: chain.id,
    address: sablier?.address,
    args: stream !== undefined ? [stream] : undefined,
  });
};

export const useSablierV2LockupLinearGetWithdrawnAmount = (stream?: bigint) => {
  const { chain } = useWeb3();
  const sablier = useSablierV2LockupLinear();

  return _useSablierV2LockupLinearGetWithdrawnAmount({
    chainId: chain.id,
    address: sablier?.address,
    args: stream !== undefined ? [stream] : undefined,
    staleTime: 30_000,
  });
};

export const usePrepareSablierV2LockupLinearWithdrawMax = (
  stream?: bigint,
  args?: Parameters<typeof _usePrepareSablierV2LockupLinearWithdrawMax>[0],
) => {
  const { chain, walletAddress } = useWeb3();
  const sablier = useSablierV2LockupLinear();

  return _usePrepareSablierV2LockupLinearWithdrawMax({
    ...args,
    chainId: chain.id,
    address: sablier?.address,
    args: stream !== undefined && walletAddress ? [stream, walletAddress] : undefined,
  });
};

export const useSablierV2NftDescriptorTokenUri = (stream?: bigint) => {
  const { chain } = useWeb3();
  const sablier = useSablierV2LockupLinear();
  const nftDescriptor = useSablierV2NFTDescriptor();

  return _useSablierV2NftDescriptorTokenUri({
    chainId: chain.id,
    address: nftDescriptor?.address,
    args: sablier && stream !== undefined ? [sablier.address, stream] : undefined,
  });
};

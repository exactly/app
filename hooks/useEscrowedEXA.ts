import { useCallback, useEffect, useState, useMemo } from 'react';
import { Address, zeroAddress, getAddress, type ContractFunctionConfig } from 'viem';
import {
  escrowedExaABI,
  useEscrowedExaBalanceOf,
  useEscrowedExaReserveRatio,
  useEscrowedExaReserves,
  useEscrowedExaVestingPeriod,
  sablierV2LockupLinearABI,
} from 'types/abi';

import useContract from './useContract';
import { useEXA } from './useEXA';
import useGraphClient from './useGraphClient';
import { useWeb3 } from './useWeb3';
import { getStreams } from 'queries/getStreams';
import { useContractReads } from 'wagmi';
import { useSablierV2LockupLinear } from './useSablier';

export const useEscrowedEXA = () => {
  return useContract('esEXA', escrowedExaABI);
};

type Stream = {
  id: string;
  tokenId: string;
  recipient: Address;
  startTime: string;
  endTime: string;
  depositAmount: string;
  withdrawnAmount: string;
  duration: string;
  intactAmount: string;
  canceled: boolean;
  cancelable: boolean;
};

export function useUpdateStreams() {
  const EXA = useEXA();
  const esEXA = useEscrowedEXA();
  const { walletAddress } = useWeb3();
  const request = useGraphClient();

  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStreams = useCallback(async () => {
    if (EXA && esEXA) {
      setLoading(true);

      let data;

      try {
        data = await request<{ streams: Stream[] }>(
          getStreams(EXA.address.toLowerCase(), walletAddress || zeroAddress, esEXA.address.toLowerCase(), false),
          'sablier',
        );
      } catch (error) {
        data = null;
        setLoading(false);
      }
      if (!data) return;
      const filteredStreams = data.streams.filter((stream: Stream) => {
        const startTime = Number(stream.startTime);
        const endTime = Number(stream.endTime);
        const duration = Number(stream.duration);
        const intactAmount = BigInt(stream.intactAmount);
        return startTime + duration === endTime && intactAmount > BigInt(0);
      });

      setActiveStreams(filteredStreams);
      setLoading(false);
    }
  }, [EXA, esEXA, request, walletAddress]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { activeStreams, loading, refetch: fetchStreams };
}

export const useEscrowedEXAReserves = (stream: bigint) => {
  const { chain } = useWeb3();
  const esEXA = useEscrowedEXA();

  return useEscrowedExaReserves({
    chainId: chain.id,
    address: esEXA?.address,
    args: [stream],
    staleTime: 30_000,
  });
};

export const useEscrowedEXABalance = () => {
  const { chain, walletAddress } = useWeb3();
  const esEXA = useEscrowedEXA();

  return useEscrowedExaBalanceOf({
    chainId: chain.id,
    address: esEXA?.address,
    args: [walletAddress ?? zeroAddress],
    staleTime: 30_000,
  });
};

export const useEscrowedEXAReserveRatio = () => {
  const { chain } = useWeb3();
  const esEXA = useEscrowedEXA();

  return useEscrowedExaReserveRatio({
    chainId: chain.id,
    address: esEXA?.address,
    staleTime: 30_000,
  });
};

export const useEscrowedEXAVestingPeriod = () => {
  const { chain } = useWeb3();
  const esEXA = useEscrowedEXA();

  return useEscrowedExaVestingPeriod({
    chainId: chain.id,
    address: esEXA?.address,
    staleTime: 30_000,
  });
};

export const useEscrowEXATotals = (streams: number[]) => {
  const { chain } = useWeb3();
  const sablier = useSablierV2LockupLinear();
  const esEXA = useEscrowedEXA();

  const { data: reserves, isLoading: reserveIsLoading } = useContractReads<
    ContractFunctionConfig<typeof escrowedExaABI, 'reserves'>[]
  >({
    contracts: streams.map((stream) => ({
      abi: escrowedExaABI,
      address: esEXA && getAddress(esEXA.address),
      functionName: 'reserves',
      args: [BigInt(stream)],
      chainId: chain.id,
    })),
  });

  const { data: withdrawables, isLoading: withdrawableIsLoading } = useContractReads<
    ContractFunctionConfig<typeof sablierV2LockupLinearABI, 'withdrawableAmountOf'>[]
  >({
    contracts: streams.map((stream) => ({
      abi: sablierV2LockupLinearABI,
      address: sablier && getAddress(sablier.address),
      functionName: 'withdrawableAmountOf',
      args: [BigInt(stream)],
      chainId: chain.id,
    })),
  });

  const sum = useCallback((arr: typeof reserves): bigint | undefined => {
    if (arr === undefined) return undefined;
    if (arr.some(({ status }) => status === 'failure')) return undefined;
    return arr.reduce((total, { status, result }) => (status === 'success' ? total + result : total), 0n);
  }, []);

  const totalReserve = useMemo(() => sum(reserves), [reserves, sum]);

  const totalWithdrawable = useMemo(() => sum(withdrawables), [withdrawables, sum]);

  return { totalReserve, reserveIsLoading, totalWithdrawable, withdrawableIsLoading };
};

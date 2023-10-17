import { useCallback, useEffect, useState } from 'react';
import { Address, zeroAddress } from 'viem';
import {
  escrowedExaABI,
  useEscrowedExaBalanceOf,
  useEscrowedExaReserveRatio,
  useEscrowedExaReserves,
  useEscrowedExaVestingPeriod,
} from 'types/abi';
import useContract from './useContract';
import { useEXA } from './useEXA';
import useGraphClient from './useGraphClient';
import { useWeb3 } from './useWeb3';
import { getStreams } from 'queries/getStreams';

export const useEscrowedEXA = () => {
  return useContract('EscrowedEXA', escrowedExaABI);
};

type Stream = {
  id: string;
  tokenId: string;
  recipient: Address;
  startTime: string;
  endTime: string;
  depositAmount: string;
  withdrawnAmount: string;
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await request<any>(
        getStreams(EXA.address.toLowerCase(), walletAddress || zeroAddress, esEXA.address.toLowerCase(), false),
        true,
      );

      const filteredStreams = data.streams.filter(
        (stream: { startTime: string; duration: string; endTime: string; intactAmount: string }) => {
          const startTime = Number(stream.startTime);
          const endTime = Number(stream.endTime);
          const duration = Number(stream.duration);
          const intactAmount = BigInt(stream.intactAmount);
          return startTime + duration === endTime && intactAmount > BigInt(0);
        },
      );

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

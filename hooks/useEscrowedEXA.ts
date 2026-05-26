import { useCallback, useEffect, useState, useMemo } from 'react';
import { Address, zeroAddress } from 'viem';
import {
  escrowedExaAbi,
  escrowedExaAddress,
  exaAddress,
  sablierV2LockupLinearAbi,
  sablierV2LockupLinearAddress,
} from 'generated/wagmi';

import useGraphClient from './useGraphClient';
import { getStreams } from 'queries/getStreams';
import { useReadContracts } from 'wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

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

const escrowedExaChainId = Object.keys(escrowedExaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof escrowedExaAddress => chainId === defaultChain.id);
const exaChainId = Object.keys(exaAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof exaAddress => chainId === defaultChain.id);
const sablierV2LockupLinearChainId = Object.keys(sablierV2LockupLinearAddress)
  .map(Number)
  .find((chainId): chainId is keyof typeof sablierV2LockupLinearAddress => chainId === defaultChain.id);

export function useUpdateStreams() {
  const { account: walletAddress } = useReadOnly();
  const EXA = exaChainId === undefined ? undefined : exaAddress[exaChainId];
  const esEXA = escrowedExaChainId === undefined ? undefined : escrowedExaAddress[escrowedExaChainId];
  const request = useGraphClient();

  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStreams = useCallback(async () => {
    if (EXA && esEXA) {
      setLoading(true);

      let data;

      try {
        data = await request<{ streams: Stream[] }>(
          getStreams(EXA.toLowerCase(), walletAddress || zeroAddress, esEXA.toLowerCase(), false),
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

export const useEscrowEXATotals = (streams: number[]) => {
  const sablier =
    sablierV2LockupLinearChainId === undefined ? undefined : sablierV2LockupLinearAddress[sablierV2LockupLinearChainId];
  const esEXA = escrowedExaChainId === undefined ? undefined : escrowedExaAddress[escrowedExaChainId];

  const { data: reserves, isLoading: reserveIsLoading } = useReadContracts({
    contracts:
      esEXA && escrowedExaChainId !== undefined
        ? streams.map((stream) => ({
            abi: escrowedExaAbi,
            address: esEXA,
            functionName: 'reserves' as const,
            args: [BigInt(stream)] as const,
            chainId: escrowedExaChainId,
          }))
        : [],
  });

  const { data: withdrawables, isLoading: withdrawableIsLoading } = useReadContracts({
    contracts:
      sablier && sablierV2LockupLinearChainId !== undefined
        ? streams.map((stream) => ({
            abi: sablierV2LockupLinearAbi,
            address: sablier,
            functionName: 'withdrawableAmountOf' as const,
            args: [BigInt(stream)] as const,
            chainId: sablierV2LockupLinearChainId,
          }))
        : [],
  });

  const sum = useCallback(
    (
      arr: readonly ({ status: 'success'; result: bigint } | { status: 'failure' })[] | undefined,
    ): bigint | undefined => {
      if (arr === undefined) return undefined;
      if (arr.some(({ status }) => status === 'failure')) return undefined;
      return arr.reduce((total, item) => (item.status === 'success' ? total + item.result : total), 0n);
    },
    [],
  );

  const totalReserve = useMemo(() => sum(reserves), [reserves, sum]);

  const totalWithdrawable = useMemo(() => sum(withdrawables), [withdrawables, sum]);

  return { totalReserve, reserveIsLoading, totalWithdrawable, withdrawableIsLoading };
};

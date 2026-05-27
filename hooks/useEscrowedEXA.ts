import { useCallback, useMemo } from 'react';
import {
  escrowedExaAbi,
  escrowedExaAddress,
  exaAddress,
  sablierV2LockupLinearAbi,
  sablierV2LockupLinearAddress,
  sablierV2LockupLinearBlock,
} from 'generated/wagmi';

import { useContractEvents, useReadContracts } from 'wagmi';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

type Stream = {
  tokenId: string;
  startTime: string;
  endTime: string;
  depositAmount: string;
  withdrawnAmount: string;
  withdrawableAmount: string;
  reserveAmount?: string;
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
  const { account } = useReadOnly();
  const EXA = exaChainId === undefined ? undefined : exaAddress[exaChainId];
  const esEXA = escrowedExaChainId === undefined ? undefined : escrowedExaAddress[escrowedExaChainId];
  const sablier =
    sablierV2LockupLinearChainId === undefined ? undefined : sablierV2LockupLinearAddress[sablierV2LockupLinearChainId];
  const fromBlock =
    sablierV2LockupLinearChainId === undefined ? undefined : sablierV2LockupLinearBlock[sablierV2LockupLinearChainId];

  const {
    data: transfersIn = [],
    isLoading: transfersInLoading,
    isFetching: transfersInFetching,
    refetch: refetchTransfersIn,
  } = useContractEvents({
    address: sablier,
    abi: sablierV2LockupLinearAbi,
    eventName: 'Transfer',
    strict: true,
    args: account ? { to: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: sablierV2LockupLinearChainId,
    query: {
      enabled: Boolean(account && sablier && fromBlock !== undefined),
      select: (logs) =>
        logs.map(({ args: { from, to, tokenId }, blockNumber, logIndex }) => ({
          from,
          to,
          tokenId,
          blockNumber,
          logIndex,
        })),
    },
  });

  const {
    data: transfersOut = [],
    isLoading: transfersOutLoading,
    isFetching: transfersOutFetching,
    refetch: refetchTransfersOut,
  } = useContractEvents({
    address: sablier,
    abi: sablierV2LockupLinearAbi,
    eventName: 'Transfer',
    strict: true,
    args: account ? { from: account } : undefined,
    fromBlock,
    toBlock: 'latest',
    chainId: sablierV2LockupLinearChainId,
    query: {
      enabled: Boolean(account && sablier && fromBlock !== undefined),
      select: (logs) =>
        logs.map(({ args: { from, to, tokenId }, blockNumber, logIndex }) => ({
          from,
          to,
          tokenId,
          blockNumber,
          logIndex,
        })),
    },
  });

  const ownedStreamIds = useMemo(() => {
    if (!account) return [];
    return Array.from(
      [...transfersIn, ...transfersOut]
        .sort((a, b) =>
          a.blockNumber === b.blockNumber ? a.logIndex - b.logIndex : a.blockNumber < b.blockNumber ? -1 : 1,
        )
        .reduce((streams, { to, tokenId }) => {
          if (to.toLowerCase() === account.toLowerCase()) {
            streams.set(tokenId.toString(), tokenId);
          } else {
            streams.delete(tokenId.toString());
          }
          return streams;
        }, new Map<string, bigint>())
        .values(),
    );
  }, [account, transfersIn, transfersOut]);

  const {
    data: streams = [],
    isLoading: streamsLoading,
    isFetching: streamsFetching,
    refetch: refetchStreams,
  } = useReadContracts({
    contracts:
      sablier && sablierV2LockupLinearChainId !== undefined
        ? ownedStreamIds.map((streamId) => ({
            abi: sablierV2LockupLinearAbi,
            address: sablier,
            functionName: 'getStream' as const,
            args: [streamId] as const,
            chainId: sablierV2LockupLinearChainId,
          }))
        : [],
    query: { enabled: Boolean(sablier && ownedStreamIds.length) },
  });

  const {
    data: reserves = [],
    isLoading: reservesLoading,
    isFetching: reservesFetching,
    refetch: refetchReserves,
  } = useReadContracts({
    contracts:
      esEXA && escrowedExaChainId !== undefined
        ? ownedStreamIds.map((streamId) => ({
            abi: escrowedExaAbi,
            address: esEXA,
            functionName: 'reserves' as const,
            args: [streamId] as const,
            chainId: escrowedExaChainId,
          }))
        : [],
    query: { enabled: Boolean(esEXA && ownedStreamIds.length) },
  });

  const activeStreams = useMemo(() => {
    if (!EXA || !esEXA) return [];
    return streams.flatMap((stream, index): Stream[] => {
      if (stream.status === 'failure') return [];
      const { sender, startTime, isCancelable, wasCanceled, asset, endTime, isDepleted, isStream, amounts } =
        stream.result;
      if (
        !isStream ||
        wasCanceled ||
        isDepleted ||
        sender.toLowerCase() !== esEXA.toLowerCase() ||
        asset.toLowerCase() !== EXA.toLowerCase()
      ) {
        return [];
      }
      const now = BigInt(Math.floor(Date.now() / 1000));
      const vestedAmount =
        now <= BigInt(startTime)
          ? 0n
          : now >= BigInt(endTime)
            ? amounts.deposited
            : (amounts.deposited * (now - BigInt(startTime))) / (BigInt(endTime) - BigInt(startTime));
      return [
        {
          tokenId: ownedStreamIds[index].toString(),
          startTime: startTime.toString(),
          endTime: endTime.toString(),
          depositAmount: amounts.deposited.toString(),
          withdrawnAmount: amounts.withdrawn.toString(),
          withdrawableAmount: (vestedAmount > amounts.withdrawn ? vestedAmount - amounts.withdrawn : 0n).toString(),
          reserveAmount: reserves[index]?.status === 'success' ? reserves[index].result.toString() : undefined,
          cancelable: isCancelable,
        },
      ];
    });
  }, [EXA, esEXA, ownedStreamIds, reserves, streams]);

  const refetch = useCallback(() => {
    void refetchTransfersIn();
    void refetchTransfersOut();
    if (ownedStreamIds.length) {
      void refetchStreams();
      void refetchReserves();
    }
  }, [ownedStreamIds.length, refetchReserves, refetchStreams, refetchTransfersIn, refetchTransfersOut]);

  const refetchStreamData = useCallback(() => {
    if (ownedStreamIds.length) {
      void refetchStreams();
      void refetchReserves();
    }
  }, [ownedStreamIds.length, refetchReserves, refetchStreams]);

  return {
    activeStreams,
    loading:
      transfersInLoading ||
      transfersInFetching ||
      transfersOutLoading ||
      transfersOutFetching ||
      streamsLoading ||
      streamsFetching ||
      reservesLoading ||
      reservesFetching,
    refetch,
    refetchStreamData,
  };
}

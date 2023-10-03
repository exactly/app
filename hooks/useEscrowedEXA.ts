import { useCallback, useEffect, useState } from 'react';
import { escrowedExaABI } from 'types/abi';
import useContract from './useContract';
import { useEXA } from './useEXA';
import useGraphClient from './useGraphClient';
import { useWeb3 } from './useWeb3';
import { getStreams } from 'queries/getStreams';
import { Address } from 'viem';

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
};

export default function useUpdateStreams() {
  const EXA = useEXA();
  const { walletAddress } = useWeb3();
  const request = useGraphClient();

  const [activeStreams, setActiveStreams] = useState<Stream[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const fetchStreams = useCallback(async () => {
    if (EXA && walletAddress) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const data = await request<any>(getStreams(EXA.address.toLowerCase(), walletAddress, false), true);

      setActiveStreams(data.streams);
      setLoading(false);
    }
  }, [EXA, request, walletAddress]);

  useEffect(() => {
    fetchStreams();
  }, [fetchStreams]);

  return { activeStreams, loading };
}

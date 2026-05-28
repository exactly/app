import { useCallback } from 'react';
import { erc20Abi, hexToSignature, type Address } from 'viem';
import { usePublicClient, useSignTypedData } from 'wagmi';
import dayjs from 'dayjs';
import useContractVersion from 'hooks/useContractVersion';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

const noncesAbi = [
  {
    type: 'function',
    name: 'nonces',
    stateMutability: 'view',
    inputs: [{ name: 'owner', type: 'address' }],
    outputs: [{ name: '', type: 'uint256' }],
  },
] as const;

export default function useSignPermit() {
  const { signTypedDataAsync } = useSignTypedData();
  const { account: walletAddress } = useReadOnly();
  const contractVersion = useContractVersion();
  const publicClient = usePublicClient();

  return useCallback(
    async ({
      spender,
      value,
      duration = 3600, // TODO why 1 hour?
      verifyingContract,
      noncesFrom,
    }: {
      spender: Address;
      value: bigint;
      duration: number;
      verifyingContract: Address;
      noncesFrom?: Address;
    }) => {
      if (!walletAddress || !publicClient) return;
      const nonce = await publicClient.readContract({
        address: noncesFrom ?? verifyingContract,
        abi: noncesAbi,
        functionName: 'nonces',
        args: [walletAddress],
        account: walletAddress,
      });
      const version = await contractVersion(verifyingContract);
      const deadline = BigInt(dayjs().unix() + duration);
      const name = noncesFrom
        ? ''
        : await publicClient.readContract({
            address: verifyingContract,
            abi: erc20Abi,
            functionName: 'name',
            account: walletAddress,
          });
      const signatureHex = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name,
          version,
          chainId: defaultChain.id,
          verifyingContract,
        },
        types: {
          Permit: [
            { name: 'owner', type: 'address' },
            { name: 'spender', type: 'address' },
            { name: 'value', type: 'uint256' },
            { name: 'nonce', type: 'uint256' },
            { name: 'deadline', type: 'uint256' },
          ],
        },
        message: {
          owner: walletAddress,
          spender,
          value,
          nonce,
          deadline,
        },
      });
      const { v, r, s } = hexToSignature(signatureHex);

      return {
        value,
        deadline,
        v: Number(v),
        r,
        s,
      };
    },
    [contractVersion, publicClient, signTypedDataAsync, walletAddress],
  );
}

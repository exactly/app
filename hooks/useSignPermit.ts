import { useCallback } from 'react';
import { Address, Hex } from 'viem';
import { useSignTypedData } from 'wagmi';
import dayjs from 'dayjs';
import useContractVersion from 'hooks/useContractVersion';
import { splitSignature } from '@ethersproject/bytes';
import { Market } from 'types/contracts';
import { useWeb3 } from 'hooks/useWeb3';

export default function useSignPermit() {
  const { signTypedDataAsync } = useSignTypedData();
  const { chain, walletAddress, opts } = useWeb3();
  const contractVersion = useContractVersion();

  return useCallback(
    async ({
      spender,
      value,
      duration = 3600, // TODO why 1 hour?
      verifyingContract,
    }: {
      spender: Address;
      value: bigint;
      duration: number;
      verifyingContract: Market;
    }) => {
      if (!verifyingContract || !walletAddress) return;
      const nonce = await verifyingContract.read.nonces([walletAddress], opts);
      const version = await contractVersion(verifyingContract.address);
      const deadline = BigInt(dayjs().unix() + duration);
      const signatureHex = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name: '',
          version,
          chainId: chain.id,
          verifyingContract: verifyingContract.address,
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
      const { v, r, s } = splitSignature(signatureHex);

      return {
        value,
        deadline,
        v,
        r: r as Hex,
        s: s as Hex,
      };
    },
    [chain.id, contractVersion, opts, signTypedDataAsync, walletAddress],
  );
}

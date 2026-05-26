import { useCallback } from 'react';
import { Address, hexToSignature } from 'viem';
import { useSignTypedData } from 'wagmi';
import dayjs from 'dayjs';
import useContractVersion from 'hooks/useContractVersion';
import { Market } from 'types/contracts';
import { defaultChain } from 'utils/client';
import useReadOnly from 'hooks/useReadOnly';

export default function useSignPermit() {
  const { signTypedDataAsync } = useSignTypedData();
  const { account: walletAddress } = useReadOnly();
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
      const nonce = await verifyingContract.read.nonces([walletAddress], {
        account: walletAddress,
      });
      const version = await contractVersion(verifyingContract.address);
      const deadline = BigInt(dayjs().unix() + duration);
      const signatureHex = await signTypedDataAsync({
        primaryType: 'Permit',
        domain: {
          name: '',
          version,
          chainId: defaultChain.id,
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
      const { v, r, s } = hexToSignature(signatureHex);

      return {
        value,
        deadline,
        v: Number(v),
        r,
        s,
      };
    },
    [contractVersion, signTypedDataAsync, walletAddress],
  );
}

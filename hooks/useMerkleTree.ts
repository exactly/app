import { useAccount } from 'wagmi';
import { MerkleTree } from 'merkletreejs';
import { keccak256, encodeAbiParameters } from 'viem';
import airdrop from '@exactly/protocol/scripts/airdrop.json' assert { type: 'json' };

const leaves = Object.entries(airdrop).map((tuple) =>
  keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint128' }], tuple)),
);
const tree = new MerkleTree(leaves, keccak256, { sort: true });

export default (): {
  leaves: string[];
  proof: string[];
  root: string;
} => {
  const { address } = useAccount();
  const index = Object.keys(airdrop).findIndex((account) => address?.toLowerCase() === account.toLowerCase());
  return {
    leaves: leaves,
    proof: tree.getHexProof(leaves[index] ?? ''),
    root: tree.getHexRoot(),
  };
};

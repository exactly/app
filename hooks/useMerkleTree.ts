import { MerkleTree } from 'merkletreejs';
import { keccak256, encodeAbiParameters, Address } from 'viem';
import airdrop from '@exactly/protocol/scripts/airdrop.json' assert { type: 'json' };
const airdropJson: { [key: string]: string } = airdrop;

const encodeLeaf = (address: string, amount: string): string =>
  keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint128' }], [address, amount]));
const leaves = Object.entries(airdropJson).map(([address, amount]) => encodeLeaf(address, amount));
const tree = new MerkleTree(leaves, keccak256, { sort: true });

export default (
  walletAddress?: Address,
): {
  canClaim: boolean;
  amount?: string;
  proof: string[];
} => {
  const amount = walletAddress ? airdropJson[walletAddress] : undefined;
  const proof = walletAddress && amount ? tree.getHexProof(encodeLeaf(walletAddress, amount)) : [];
  const canClaim = Boolean(walletAddress && amount && proof.length > 0);
  return { canClaim, amount, proof };
};

import { MerkleTree } from 'merkletreejs';
import { keccak256, encodeAbiParameters, Address, Hex, isHex } from 'viem';
import airdrop from '@exactly/protocol/scripts/airdrop.json' assert { type: 'json' };
const airdropJson: { [key: string]: string } = airdrop;

const encodeLeaf = (address: string, amount: string): string =>
  keccak256(encodeAbiParameters([{ type: 'address' }, { type: 'uint128' }], [address, amount]));
const leaves = Object.entries(airdropJson).map(([address, amount]) => encodeLeaf(address, amount));
const tree = new MerkleTree(leaves, keccak256, { sort: true });

export default (
  walletAddress?: Address,
):
  | {
      canClaim: false;
    }
  | {
      canClaim: true;
      amount: bigint;
      proof: Hex[];
    } => {
  if (!walletAddress) {
    return { canClaim: false };
  }

  const amount = airdropJson[walletAddress.toLowerCase()] || '';
  const proof = amount ? tree.getHexProof(encodeLeaf(walletAddress.toLowerCase(), amount)) : [];
  const canClaim = Boolean(amount && proof.length > 0);
  if (proof.some((p) => !isHex(p))) {
    return { canClaim: false };
  }

  return { canClaim, amount: BigInt(amount), proof: proof as Hex[] };
};

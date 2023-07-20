import { MerkleTree } from 'merkletreejs';
import { keccak256, toHex } from 'viem';

export default function () {
  const hashFunction = (x: any) => keccak256(toHex(x));
  const leaves = ['a', 'b', 'c'].map((x) => hashFunction(x));
  const tree = new MerkleTree(leaves, hashFunction);
  const root = toHex(tree.getRoot());
  const leaf = hashFunction('a');
  const proof = tree.getProof(leaf);
  console.log('verify es true: ', tree.verify(proof, leaf, root)); // true

  const badLeaves = ['a', 'x', 'c'].map((x) => hashFunction(x));
  const badTree = new MerkleTree(badLeaves, hashFunction);
  const badLeaf = hashFunction('x');
  const badProof = badTree.getProof(badLeaf);
  console.log('verify es false: ', badTree.verify(badProof, badLeaf, root)); // false
}

import { MerkleTree } from 'merkletreejs';
import { keccak256, toHex } from 'viem';
import airdrop from 'public/airdrop.json' assert { type: 'json' };
// import { useWeb3 } from './useWeb3';

type MerkleTreeProps = {
  root: string;
  leaves: string[];
  proof: string[];
};

export default (): MerkleTreeProps => {
  // const { walletAddress } = useWeb3();
  const hashFunction = (x: string) => keccak256(toHex(x));
  const leaves = airdrop.map(([address, assets]) => hashFunction(address + assets));
  console.log('leaves', leaves);
  const tree = new MerkleTree(leaves, hashFunction);
  const proof = tree.getProof(hashFunction('0x8967782Fb0917bab83F13Bd17db3b41C700b368D420000000000000000000'));
  console.log('hashed leaves');
  proof.forEach(({ position, data }) => {
    console.log(position, toHex(data));
  });
  console.log(toHex(tree.getRoot()));

  return {
    root: '',
    leaves: [],
    proof: [],
  };
};

import { ethers } from 'ethers';

export type Contract = {
  abi: ethers.ContractInterface;
  address: string;
};

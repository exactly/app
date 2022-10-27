import type { ContractInterface } from '@ethersproject/contracts';

export type Contract = {
  abi: ContractInterface;
  address: string;
};

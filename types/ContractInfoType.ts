import { Address } from 'viem';

export type ContractDetails = {
  name: string;
  address: Address;
};

export type ContractInfoType = {
  name: string;
  audited: boolean;
  description: string;
  reports: string[];
  information: string[];
  proxy: ContractDetails[];
  implementation: ContractDetails[] | null;
  codeLink: string;
};

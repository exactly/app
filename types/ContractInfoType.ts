import { Address } from 'viem';

export type ContractInfoType = {
  name: string;
  audited: boolean;
  description: string;
  reports: string[];
  information: string[];
  proxy: () => Address;
  implementation: () => Address | null;
  codeLink: string;
};

import { BigNumber } from 'ethers';

export type Deposit = {
  id?: string;
  market: string;
  symbol?: string;
  maturity: string;
  assets?: BigNumber;
  fee: BigNumber;
  owner?: string;
  caller?: string;
  timestamp?: string;
  editable?: boolean;
};

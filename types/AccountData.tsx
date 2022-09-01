import { FixedLenderAccountData } from './FixedLenderAccountData';

export type AccountData = {
  walletAddress: string;
  [Key: string]: FixedLenderAccountData;
};

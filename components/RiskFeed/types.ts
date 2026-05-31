import { Address, Hex } from 'viem';

export type SafeResponse = {
  count: number;
  next: number | null;
  previous: number | null;
  results: Result[];
};

type Result = { type: 'LABEL' | 'DATE_LABEL' } | { type: 'TRANSACTION'; transaction: Transaction };

type TxID = `multisig_${Address}_${Hex}`;

export type Transaction = {
  id: TxID;
  timestamp: number;
  txStatus: 'SUCCESS' | 'AWAITING_EXECUTION';
  txInfo: TxInfo;
  executionInfo: null | ExecutionInfo;
};

type TxInfo = {
  type: string;
  humanDescription: null | string;
  to: Wallet;
  dataSize: string;
  value: string;
  methodName: null | 'multiSend' | 'execute' | 'schedule';
  actionCount: null | number;
  isCancellation: boolean;
};

type ExecutionInfo = {
  type: string;
  nonce: number;
  confirmationsRequired: number;
  confirmationsSubmitted: number;
};

export type SafeTransaction = {
  safeAddress: string;
  txId: TxID;
  executedAt: null | number;
  txStatus: 'SUCCESS' | 'AWAITING_EXECUTION';
  txInfo: TxInfo;
  txData: null | TxData;
  txHash: null | Hex;
  detailedExecutionInfo: DetailedExecutionInfo;
};

type DetailedExecutionInfo = {
  submittedAt: number;
  refundReceiver: Wallet;
  safeTxHash: Hex;
  executor: null | Wallet;
  signers: Wallet[];
  confirmationsRequired: number;
  confirmations: Confirmation[];
  trusted: boolean;
};

type Confirmation = {
  signer: Wallet;
  signature: Hex;
  submittedAt: number;
};

type Wallet = {
  value: Address;
  name: null | string;
  logoUri: null | string;
};

type TxData = {
  hexData: Hex;
  dataDecoded: DataDecoded | null;
  to: Wallet;
  value: string;
  operation: number;
  addressInfoIndex: Record<Address, Wallet>;
};

export type DataDecoded = {
  method: string;
  parameters: Parameter[];
};

type Parameter = {
  name: string;
  type: string;
  value: string;
  valueDecoded?: ValueDecoded[];
};

type ValueDecoded = {
  operation: number;
  to: Address;
  value: string;
  data: string;
  dataDecoded: DataDecoded;
};

export type Call = {
  id: Hex;
  operations: { index: number; target: Address; data: Hex }[];
  scheduledAt: number;
  executedAt: number | null;
  cancelledAt: number | null;
};

import { SvgIconProps } from '@mui/material';
import { ComponentType } from 'react';

export type ActiveRoutesResponse = {
  success: boolean;
  result: Result;
};

export type Result = {
  activeRoutes: ActiveRoute[];
  pagination: Pagination;
};

export type ActiveRoute = {
  activeRouteId: number;
  userAddress: string;
  totalUserTx: number;
  userTxs: UserTx[];
  fromChainId: number;
  toChainId: number;
  fromAssetAddress: string;
  toAssetAddress: string;
  fromAmount: number;
  toAmount: number;
  refuel: null;
  routeStatus: Status;
  transactionData: TransactionData;
  bridgeTxHash: string;
  recipient: string;
  integratorId: number;
  destinationCallData: null;
  bridgeInsuranceData: null;
  integratorFee: IntegratorFee;
  createdAt: Date;
  updatedAt: Date;
  currentUserTxIndex: number | null;
  fromAsset: Asset;
  toAsset: Asset;
};

export type Asset = {
  chainId: number;
  address: string;
  symbol: string;
  name: string;
  decimals: number;
  icon: string;
  logoURI: string;
  chainAgnosticId: string | null;
};

export type IntegratorFee = {
  asset: Asset;
  amount: number;
};

export type TransactionData = {
  '0': The0;
};

export type The0 = {
  txHash: string;
  chainId: number;
};

export type UserTx = {
  steps?: Step[];
  sender: string;
  txType: string;
  chainId: number;
  gasFees: GasFees;
  toAsset: Asset;
  toAmount: number;
  recipient: string;
  routePath?: string;
  stepCount?: number;
  userTxType: string;
  serviceTime?: number;
  userTxIndex: number;
  approvalData: ApprovalData | null;
  bridgeSlippage?: number;
  maxServiceTime?: number;
  sourceTransactionHash: string;
  sourceTransactionReceipt: SourceTransactionReceipt;
  protocol?: UserTxProtocol;
  fromAsset?: Asset;
  fromAmount?: number;
  minAmountOut?: number;
  swapSlippage?: number;
  userTxStatus?: string;
};

export type ApprovalData = {
  owner: string;
  allowanceTarget: string;
  approvalTokenAddress: string;
  minimumApprovalAmount: number;
};

export type GasFees = {
  asset: Asset;
  gasLimit: number;
  feesInUsd: number;
  gasAmount: number;
};

export type UserTxProtocol = {
  icon: string;
  name: string;
  displayName: string;
};

export type SourceTransactionReceipt = {
  to: string;
  from: string;
  logs: Log[];
  type: number;
  status: number;
  gasUsed: CumulativeGasUsed;
  blockHash: string;
  byzantium: boolean;
  logsBloom: string;
  blockNumber: number;
  confirmations: number;
  contractAddress: null;
  transactionHash: string;
  transactionIndex: number;
  cumulativeGasUsed: CumulativeGasUsed;
  effectiveGasPrice: CumulativeGasUsed;
};

export type CumulativeGasUsed = {
  hex: string;
  type: Type;
};

export type Type = 'BigNumber';

export type Log = {
  data: string;
  topics: string[];
  address: string;
  logIndex: number;
  blockHash: string;
  blockNumber: number;
  transactionHash: string;
  transactionIndex: number;
};

export type Step = {
  type: string;
  gasFees: GasFees;
  toAsset: Asset;
  protocol: StepProtocol;
  toAmount: number;
  fromAsset: Asset;
  toChainId: number;
  fromAmount: number;
  fromChainId: number;
  serviceTime: number;
  minAmountOut: number;
  protocolFees: ProtocolFees;
  bridgeSlippage: number;
  maxServiceTime: number;
};

export type StepProtocol = {
  icon: string;
  name: string;
  displayName: string;
  securityScore: number;
  robustnessScore: number;
};

export type ProtocolFees = {
  asset: Asset;
  amount: number;
  feesInUsd: number;
};

export type Pagination = {
  offset: number;
  limit: number;
  totalRecords: number;
};

export type Status = 'READY' | 'PENDING' | 'COMPLETED' | 'FAILED';

export type StatusData = { statusLabel: string; Icon: ComponentType<SvgIconProps>; color: string };

export type TxData = {
  route: ActiveRoute;
  protocol?: UserTxProtocol;
  type: string;
  status: StatusData;
  url: string;
};

export type BridgeInput = {
  sourceChainId?: number;
  sourceToken: string;
  destinationChainId?: number;
  destinationToken: string;
  sourceAmount: string;
  destinationAmount: string;
};

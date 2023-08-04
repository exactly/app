import { SvgIconProps } from '@mui/material';
import { ComponentType } from 'react';
import { Address } from 'viem';

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
  userAddress: Address;
  totalUserTx: number;
  userTxs: UserTx[];
  fromChainId: number;
  toChainId: number;
  fromAssetAddress: Address;
  toAssetAddress: Address;
  fromAmount: number;
  toAmount: number;
  refuel: null;
  routeStatus: Status;
  transactionData: {
    '0': {
      txHash: string;
      chainId: number;
    };
  };
  bridgeTxHash: string;
  recipient: string;
  integratorId: number;
  destinationCallData: null;
  bridgeInsuranceData: null;
  integratorFee: IntegratorFee;
  createdAt: string;
  updatedAt: string;
  currentUserTxIndex: number | null;
  fromAsset: Asset;
  toAsset: Asset;
};

export type Asset = {
  chainId: number;
  address: Address;
  symbol: string;
  name: string;
  decimals: number;
  icon?: string;
  logoURI: string;
  chainAgnosticId: string | null;
};

export type AssetBalance = Asset & { amount: number; usdAmount?: number };

export type IntegratorFee = {
  asset: Asset;
  amount: number;
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
  allowanceTarget: Address;
  approvalTokenAddress: Address;
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
  contractAddress: Address | null;
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
  address: Address;
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

export type TokensResponse = {
  success: boolean;
  result: Record<number, Asset[]>;
};

export type ChainsResponse = {
  success: boolean;
  result: Chain[];
};

export type Chain = {
  chainId: number;
  name: string;
  isL1: boolean;
  sendingEnabled: boolean;
  icon: string;
  receivingEnabled: boolean;
  rpcs: string[];
  explorers: string[];
};

export type TokenPrice = {
  chainId: number;
  tokenAddress: Address;
  tokenPrice: number;
  decimals: number;
  currency: string;
};

export type RoutesResponse = {
  success: boolean;
  result?: {
    routes: Route[];
    fromChainId: number;
    fromAsset: Asset;
    toChainId: number;
    toAsset: Asset;
  };
};

export type Route = {
  routeId: string;
  isOnlySwapRoute: boolean;
  fromAmount: string;
  toAmount: string;
  sender: string;
  recipient: string;
  totalUserTx: number;
  totalGasFeesInUsd: number;
  userTxs: UserTx[];
  usedDexName: string;
  integratorFee: IntegratorFee;
  outputValueInUsd: number;
  receivedValueInUsd: number;
  inputValueInUsd: number;
};

export type Protocol = {
  name: string;
  displayName: string;
  icon: string;
};

export type BridgeStatus = {
  sourceTxStatus: Status;
  destinationTxStatus: Status;
  destinationTransactionHash: string;
  sourceTransactionHash: string;
};

export type DestinationCallData = {
  destinationPayload: string;
  destinationGasLimit: bigint;
};

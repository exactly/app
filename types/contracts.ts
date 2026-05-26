import type { Abi, Account, Address, Chain, GetContractReturnType, PublicClient, Transport, WalletClient } from 'viem';

import {
  auditorAbi,
  debtManagerAbi,
  debtPreviewerAbi,
  erc20Abi,
  interestRateModelAbi,
  marketAbi,
  marketEthRouterAbi,
  previewerAbi,
  legacyPreviewerAbi,
  rewardsControllerAbi,
  permit2Abi,
  sablierV2LockupLinearAbi,
  escrowedExaAbi,
  swapperAbi,
} from 'generated/wagmi';

type ContractClients = { public: PublicClient; wallet: WalletClient<Transport, Chain | undefined, Account> };
type ReadContractClient = { public: PublicClient };

export type ContractType<T extends Abi> = GetContractReturnType<T, ContractClients, Address>;
export type ReadContractType<T extends Abi> = GetContractReturnType<T, ReadContractClient, Address>;

export type ERC20 = ContractType<typeof erc20Abi>;
export type Auditor = ContractType<typeof auditorAbi>;
export type Previewer = ReadContractType<typeof previewerAbi>;
export type LegacyPreviewer = ReadContractType<typeof legacyPreviewerAbi>;
export type Market = ContractType<typeof marketAbi>;
export type MarketETHRouter = ContractType<typeof marketEthRouterAbi>;
export type InterestRateModel = ContractType<typeof interestRateModelAbi>;
export type RewardsController = ContractType<typeof rewardsControllerAbi>;
export type DebtManager = ContractType<typeof debtManagerAbi>;
export type Permit2 = ContractType<typeof permit2Abi>;
export type DebtPreviewer = ContractType<typeof debtPreviewerAbi>;
export type SablierV2LockupLinear = ContractType<typeof sablierV2LockupLinearAbi>;
export type EscrowedEXA = ContractType<typeof escrowedExaAbi>;
export type Swapper = ContractType<typeof swapperAbi>;

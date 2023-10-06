import { Abi, WalletClient } from 'viem';
import { getContract } from '@wagmi/core';

import {
  auditorABI,
  debtManagerABI,
  debtPreviewerABI,
  erc20ABI,
  interestRateModelABI,
  marketABI,
  marketEthRouterABI,
  previewerABI,
  rewardsControllerABI,
  permit2ABI,
  sablierV2LockupLinearABI,
  escrowedExaABI,
  swapperABI,
} from './abi';

export type ContractType<T extends Abi> = ReturnType<typeof getContract<T, WalletClient>>;
export type ReadContractType<T extends Abi> = ReturnType<typeof getContract<T, unknown>>;

export type ERC20 = ContractType<typeof erc20ABI>;
export type Auditor = ContractType<typeof auditorABI>;
export type Previewer = ReadContractType<typeof previewerABI>;
export type Market = ContractType<typeof marketABI>;
export type MarketETHRouter = ContractType<typeof marketEthRouterABI>;
export type InterestRateModel = ContractType<typeof interestRateModelABI>;
export type RewardsController = ContractType<typeof rewardsControllerABI>;
export type DebtManager = ContractType<typeof debtManagerABI>;
export type Permit2 = ContractType<typeof permit2ABI>;
export type DebtPreviewer = ContractType<typeof debtPreviewerABI>;
export type SablierV2LockupLinear = ContractType<typeof sablierV2LockupLinearABI>;
export type EscrowedEXA = ContractType<typeof escrowedExaABI>;
export type Swapper = ContractType<typeof swapperABI>;

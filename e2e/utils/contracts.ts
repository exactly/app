import { getContract, isAddress, type PublicClient, type WalletClient } from 'viem';
import auditorContract from '@exactly/protocol/deployments/optimism/Auditor.json' assert { type: 'json' };
import marketETHRouter from '@exactly/protocol/deployments/optimism/MarketETHRouter.json' assert { type: 'json' };
import debtManagerContract from '@exactly/protocol/deployments/optimism/DebtManager.json' assert { type: 'json' };
import permit2Contract from '@exactly/protocol/deployments/optimism/Permit2.json' assert { type: 'json' };
import sablierV2LockupLinearContract from '@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json' assert { type: 'json' };
import escrowedEXAContract from '@exactly/protocol/deployments/optimism/esEXA.json' assert { type: 'json' };
import swapperContract from '@exactly/protocol/deployments/optimism/Swapper.json' assert { type: 'json' };

import type {
  Auditor,
  Market,
  MarketETHRouter,
  ERC20,
  DebtManager,
  Permit2,
  SablierV2LockupLinear,
  EscrowedEXA,
  Swapper,
} from '../../types/contracts';
import {
  auditorABI,
  marketABI,
  marketEthRouterABI,
  erc20ABI,
  debtManagerABI,
  permit2ABI,
  sablierV2LockupLinearABI,
  escrowedExaABI,
  swapperABI,
} from '../../types/abi';

const ERC20TokenSymbols = ['WETH', 'USDC', 'OP', 'esEXA', 'EXA'] as const;
export type ERC20TokenSymbol = (typeof ERC20TokenSymbols)[number];
export type Coin = ERC20TokenSymbol | 'ETH';

type Clients = {
  publicClient?: PublicClient;
  walletClient?: WalletClient;
};

export const erc20 = async (symbol: ERC20TokenSymbol, clients: Clients = {}): Promise<ERC20> => {
  const {
    default: { address },
  } = await import(`@exactly/protocol/deployments/optimism/${symbol}.json`, {
    assert: { type: 'json' },
  });
  if (!isAddress(address)) throw new Error('Invalid address');
  return getContract({ address, abi: erc20ABI, ...clients });
};

export const erc20Market = async (symbol: ERC20TokenSymbol, clients: Clients = {}): Promise<Market> => {
  const {
    default: { address },
  } = await import(`@exactly/protocol/deployments/optimism/Market${symbol}.json`, {
    assert: { type: 'json' },
  });
  if (!isAddress(address)) throw new Error('Invalid address');
  return getContract({ address, abi: marketABI, ...clients });
};

export const ethRouter = async (clients: Clients = {}): Promise<MarketETHRouter> => {
  if (!isAddress(marketETHRouter.address)) throw new Error('Invalid address');
  return getContract({ address: marketETHRouter.address, abi: marketEthRouterABI, ...clients });
};

export const auditor = async (clients: Clients = {}): Promise<Auditor> => {
  if (!isAddress(auditorContract.address)) throw new Error('Invalid address');
  return getContract({ address: auditorContract.address, abi: auditorABI, ...clients });
};

export const debtManager = async (clients: Clients = {}): Promise<DebtManager> => {
  if (!isAddress(debtManagerContract.address)) throw new Error('Invalid address');
  return getContract({ address: debtManagerContract.address, abi: debtManagerABI, ...clients });
};

export const permit2 = async (clients: Clients = {}): Promise<Permit2> => {
  if (!isAddress(permit2Contract.address)) throw new Error('Invalid address');
  return getContract({ address: permit2Contract.address, abi: permit2ABI, ...clients });
};

export const sablierV2LockupLinear = async (clients: Clients = {}): Promise<SablierV2LockupLinear> => {
  if (!isAddress(sablierV2LockupLinearContract.address)) throw new Error('Invalid address');
  return getContract({ address: sablierV2LockupLinearContract.address, abi: sablierV2LockupLinearABI, ...clients });
};

export const escrowedEXA = async (clients: Clients = {}): Promise<EscrowedEXA> => {
  if (!isAddress(escrowedEXAContract.address)) throw new Error('Invalid address');
  return getContract({ address: escrowedEXAContract.address, abi: escrowedExaABI, ...clients });
};

export const swapper = async (clients: Clients = {}): Promise<Swapper> => {
  if (!isAddress(swapperContract.address)) throw new Error('Invalid address');
  return getContract({ address: swapperContract.address, abi: swapperABI, ...clients });
};

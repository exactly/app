import { createRequire } from 'node:module';

import { getContract, isAddress, type PublicClient, type WalletClient } from 'viem';

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
  auditorAbi,
  marketAbi,
  marketEthRouterAbi,
  erc20Abi,
  debtManagerAbi,
  permit2Abi,
  sablierV2LockupLinearAbi,
  escrowedExaAbi,
  swapperAbi,
} from '../../generated/wagmi';

const require = createRequire(import.meta.url);
const auditorContract = require('../deployments/anvil/Auditor.json') as { address: string };
const debtManagerContract = require('../deployments/anvil/DebtManager.json') as { address: string };
const escrowedEXAContract = require('../deployments/anvil/esEXA.json') as { address: string };
const exaContract = require('../deployments/anvil/EXA.json') as { address: string };
const marketEXAContract = require('../deployments/anvil/MarketEXA.json') as { address: string };
const marketETHRouter = require('../deployments/anvil/MarketETHRouter.json') as { address: string };
const marketOPContract = require('../deployments/anvil/MarketOP.json') as { address: string };
const marketUSDCContract = require('../deployments/anvil/MarketUSDC.json') as { address: string };
const marketWETHContract = require('../deployments/anvil/MarketWETH.json') as { address: string };
const opContract = require('../deployments/anvil/OP.json') as { address: string };
const permit2Contract = require('../deployments/anvil/Permit2.json') as { address: string };
const sablierV2LockupLinearContract = require('../deployments/anvil/SablierV2LockupLinear.json') as { address: string };
const swapperContract = require('../deployments/anvil/Swapper.json') as { address: string };
const usdcContract = require('../deployments/anvil/USDC.json') as { address: string };
const wethContract = require('../deployments/anvil/WETH.json') as { address: string };

const ERC20TokenSymbols = ['WETH', 'USDC', 'USDC.e', 'OP', 'esEXA', 'EXA'] as const;
export type ERC20TokenSymbol = (typeof ERC20TokenSymbols)[number];
export type Coin = ERC20TokenSymbol | 'ETH';

type Clients = {
  publicClient?: PublicClient;
  walletClient?: WalletClient;
};

const client = ({ publicClient, walletClient }: Clients) =>
  publicClient && walletClient
    ? { client: { public: publicClient, wallet: walletClient } }
    : publicClient || walletClient
      ? { client: publicClient ?? walletClient }
      : {};

const erc20Deployments = {
  EXA: exaContract,
  OP: opContract,
  USDC: usdcContract,
  'USDC.e': usdcContract,
  WETH: wethContract,
  esEXA: escrowedEXAContract,
} as const satisfies Record<ERC20TokenSymbol, { address: string }>;

const marketDeployments = {
  EXA: marketEXAContract,
  OP: marketOPContract,
  USDC: marketUSDCContract,
  WETH: marketWETHContract,
} as const satisfies Partial<Record<ERC20TokenSymbol, { address: string }>>;

export const erc20 = async (symbol: ERC20TokenSymbol, clients: Clients = {}): Promise<ERC20> => {
  const { address } = erc20Deployments[symbol];
  if (!isAddress(address)) throw new Error('Invalid address');
  return getContract({ address, abi: erc20Abi, ...client(clients) });
};

export const erc20Market = async (symbol: ERC20TokenSymbol, clients: Clients = {}): Promise<Market> => {
  const deployment = marketDeployments[symbol];
  if (!deployment || !isAddress(deployment.address)) throw new Error('Invalid address');
  return getContract({ address: deployment.address, abi: marketAbi, ...client(clients) });
};

export const ethRouter = async (clients: Clients = {}): Promise<MarketETHRouter> => {
  if (!isAddress(marketETHRouter.address)) throw new Error('Invalid address');
  return getContract({ address: marketETHRouter.address, abi: marketEthRouterAbi, ...client(clients) });
};

export const auditor = async (clients: Clients = {}): Promise<Auditor> => {
  if (!isAddress(auditorContract.address)) throw new Error('Invalid address');
  return getContract({ address: auditorContract.address, abi: auditorAbi, ...client(clients) });
};

export const debtManager = async (clients: Clients = {}): Promise<DebtManager> => {
  if (!isAddress(debtManagerContract.address)) throw new Error('Invalid address');
  return getContract({ address: debtManagerContract.address, abi: debtManagerAbi, ...client(clients) });
};

export const permit2 = async (clients: Clients = {}): Promise<Permit2> => {
  if (!isAddress(permit2Contract.address)) throw new Error('Invalid address');
  return getContract({ address: permit2Contract.address, abi: permit2Abi, ...client(clients) });
};

export const sablierV2LockupLinear = async (clients: Clients = {}): Promise<SablierV2LockupLinear> => {
  if (!isAddress(sablierV2LockupLinearContract.address)) throw new Error('Invalid address');
  return getContract({
    address: sablierV2LockupLinearContract.address,
    abi: sablierV2LockupLinearAbi,
    ...client(clients),
  });
};

export const escrowedEXA = async (clients: Clients = {}): Promise<EscrowedEXA> => {
  if (!isAddress(escrowedEXAContract.address)) throw new Error('Invalid address');
  return getContract({ address: escrowedEXAContract.address, abi: escrowedExaAbi, ...client(clients) });
};

export const swapper = async (clients: Clients = {}): Promise<Swapper> => {
  if (!isAddress(swapperContract.address)) throw new Error('Invalid address');
  return getContract({ address: swapperContract.address, abi: swapperAbi, ...client(clients) });
};

import { auditorABI, marketABI, marketEthRouterABI, erc20ABI } from '../../../types/abi';
import { Auditor, Market, MarketETHRouter, ERC20 } from '../../../types/contracts';

import auditorContract from '@exactly/protocol/deployments/mainnet/Auditor.json';
import marketETHRouter from '@exactly/protocol/deployments/mainnet/MarketETHRouter.json';
import { getContract, isAddress } from 'viem';

const ERC20TokenSymbols = ['WETH', 'DAI', 'USDC', 'WBTC', 'wstETH'] as const;
export type ERC20TokenSymbol = (typeof ERC20TokenSymbols)[number];
export type Coin = ERC20TokenSymbol | 'ETH';

type Clients = Pick<Parameters<typeof getContract>[0], 'walletClient' | 'publicClient'>;

export const erc20 = async (symbol: ERC20TokenSymbol, clients: Clients = {}): Promise<ERC20> => {
  const { address } = await import(`@exactly/protocol/deployments/mainnet/${symbol}.json`);
  if (!isAddress(address)) throw new Error('Invalid address');
  return getContract({ address, abi: erc20ABI, ...clients });
};

export const erc20Market = async (symbol: ERC20TokenSymbol, clients: Clients = {}): Promise<Market> => {
  const { address } = await import(`@exactly/protocol/deployments/mainnet/Market${symbol}.json`);
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

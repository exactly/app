import { Contract } from '@ethersproject/contracts';
import { Signer } from '@ethersproject/abstract-signer';
import { Provider } from '@ethersproject/abstract-provider';

import type { Previewer } from '../../../types/contracts/Previewer';
import type { Auditor } from '../../../types/contracts/Auditor';
import type { Market } from '../../../types/contracts/Market';
import type { MarketETHRouter } from '../../../types/contracts/MarketETHRouter';
import type { ERC20 } from '../../../types/contracts/ERC20';

import previewerContract from '@exactly-protocol/protocol/deployments/mainnet/Previewer.json';
import auditorContract from '@exactly-protocol/protocol/deployments/mainnet/Auditor.json';
import marketETHRouter from '@exactly-protocol/protocol/deployments/mainnet/MarketETHRouter.json';

const ERC20TokenSymbols = ['WETH', 'DAI', 'USDC', 'WBTC', 'wstETH'] as const;
export type ERC20TokenSymbol = (typeof ERC20TokenSymbols)[number];
export type Coin = ERC20TokenSymbol | 'ETH';

export const erc20 = async (symbol: ERC20TokenSymbol, signer?: Signer): Promise<ERC20> => {
  const contract = await import(`@exactly-protocol/protocol/deployments/mainnet/${symbol}.json`);
  return new Contract(contract.address, contract.abi, signer) as ERC20;
};

export const erc20Market = async (symbol: ERC20TokenSymbol, signer?: Signer): Promise<Market> => {
  const contract = await import(`@exactly-protocol/protocol/deployments/mainnet/Market${symbol}.json`);
  return new Contract(contract.address, contract.abi, signer) as Market;
};

export const ethRouter = (signer: Signer): MarketETHRouter => {
  return new Contract(marketETHRouter.address, marketETHRouter.abi, signer) as MarketETHRouter;
};

export const auditor = (signer: Signer): Auditor => {
  return new Contract(auditorContract.address, auditorContract.abi, signer) as Auditor;
};

export const previewer = (provider: Provider | Signer): Previewer => {
  return new Contract(previewerContract.address, previewerContract.abi, provider) as Previewer;
};

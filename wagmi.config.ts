import { defineConfig } from '@wagmi/cli';
import { actions, react } from '@wagmi/cli/plugins';
import { createRequire } from 'node:module';

import type { Abi, Address } from 'viem';
import { anvil, base, baseSepolia, mainnet, optimism, optimismSepolia } from 'viem/chains';

const require = createRequire(import.meta.url);

const ExtraFinanceLendingABI = require('./abi/extraFinanceLending.json');
const DelegateRegistryABI = require('./abi/DelegateRegistry.json');
const GasPriceOracle = require('./abi/GasPriceOracle.json');

type DeploymentNetwork = 'ethereum' | 'optimism' | 'op-sepolia' | 'base' | 'base-sepolia' | 'anvil';
type Deployment = { abi?: Abi; address: Address; deployedBytecode?: string; receipt?: { blockNumber?: number } };
type ContractEntry = string | { name?: string; block?: true | number };

const addressOnlyAbi = [] as const satisfies Abi;
const contractBlocks: { name: string; address: Record<number, Address>; blocks: Record<number, number> }[] = [];

const chainIdByDeploymentNetwork = {
  ethereum: mainnet.id,
  optimism: optimism.id,
  'op-sepolia': optimismSepolia.id,
  base: base.id,
  'base-sepolia': baseSepolia.id,
  anvil: anvil.id,
} as const satisfies Record<DeploymentNetwork, number>;

function deployment(network: DeploymentNetwork, name: string): Deployment {
  if (network === 'anvil') return require(`./e2e/deployments/anvil/${name}.json`) as Deployment;
  return require(`@exactly/protocol/deployments/${network}/${name}.json`) as Deployment;
}

function deploymentWithAbi(network: DeploymentNetwork, name: string): Deployment & { abi: Abi } {
  const result = deployment(network, name);
  if (!result.abi) throw new Error(`missing ABI for ${network}/${name}`);
  return { ...result, abi: result.abi };
}

function camelCase(value: string) {
  return value
    .replace(/([A-Z]+)([A-Z][a-z])/g, '$1 $2')
    .replace(/([a-z0-9])([A-Z])/g, '$1 $2')
    .split(/[^A-Za-z0-9]+/)
    .filter(Boolean)
    .map((word, index) => {
      const lower = word.toLowerCase();
      return index === 0 ? lower : lower[0].toUpperCase() + lower.slice(1);
    })
    .join('');
}

function contract(
  name: string,
  networks: readonly DeploymentNetwork[] | Partial<Record<DeploymentNetwork, ContractEntry>>,
  withAbi = false,
) {
  let abi: Abi | undefined;
  const blocks: Record<number, number> = {};
  const address = Object.fromEntries(
    Object.entries(
      Array.isArray(networks) ? Object.fromEntries(networks.map((network) => [network, name])) : networks,
    ).map(([network, entry]) => {
      const deploymentNetwork = network as DeploymentNetwork;
      const deploymentName = typeof entry === 'string' ? entry : entry?.name ?? name;
      const result = deployment(deploymentNetwork, deploymentName);
      if (withAbi) {
        if (!abi && !result.abi) throw new Error(`missing ABI for ${deploymentNetwork}/${deploymentName}`);
        abi ??= result.abi;
      }
      if (typeof entry === 'object' && entry.block !== undefined) {
        const blockNumber =
          typeof entry.block === 'number'
            ? entry.block
            : deploymentNetwork === 'anvil'
              ? 0
              : result.receipt?.blockNumber;
        if (blockNumber === undefined) throw new Error(`missing block for ${deploymentNetwork}/${deploymentName}`);
        blocks[chainIdByDeploymentNetwork[deploymentNetwork]] = blockNumber;
      }
      return [chainIdByDeploymentNetwork[deploymentNetwork], result.address];
    }),
  ) as Record<number, Address>;

  if (Object.keys(blocks).length) contractBlocks.push({ name, address, blocks });

  return { name, abi: abi ?? addressOnlyAbi, address };
}

const ERC20 = deploymentWithAbi('op-sepolia', 'DAI');
const Market = deploymentWithAbi('op-sepolia', 'MarketDAI');
const InterestRateModel = deploymentWithAbi('op-sepolia', 'InterestRateModelDAI');

const blocks = {
  name: 'blocks',
  run: () => ({
    content: [
      ...contractBlocks.map(
        ({ name, blocks: block }) =>
          `export const ${camelCase(name)}Block = ${JSON.stringify(block, null, 2)
            .replace(/"(\d+)":/gm, '$1:')
            .replace(/: (\d+)/g, ': $1n')} as const`,
      ),
      `export const marketBlocks = ${JSON.stringify(
        contractBlocks.reduce(
          (acc, { name, address, blocks: block }) => {
            if (!name.startsWith('Market')) return acc;
            Object.entries(block).forEach(([chainId, value]) => {
              acc[Number(chainId)] ??= {};
              acc[Number(chainId)][address[Number(chainId)].toLowerCase()] = value;
            });
            return acc;
          },
          {} as Record<number, Record<string, number>>,
        ),
        null,
        2,
      )
        .replace(/"(\d+)":/gm, '$1:')
        .replace(/: (\d+)/g, ': $1n')} as const`,
    ].join('\n\n'),
  }),
};

const ratePreviewerCodes = {
  name: 'ratePreviewerCode',
  run: () => ({
    content: `export const ratePreviewerCode = ${JSON.stringify(
      Object.fromEntries(
        (['optimism', 'base', 'op-sepolia', 'base-sepolia', 'anvil'] as const).map((network) => [
          chainIdByDeploymentNetwork[network],
          deployment('optimism', 'RatePreviewer_Implementation').deployedBytecode?.replace(
            /7f0{64}/g,
            `7f${deployment(network, 'Auditor').address.slice(2).toLowerCase().padStart(64, '0')}`,
          ),
        ]),
      ),
      null,
      2,
    ).replace(/"(\d+)":/gm, '$1:')} as const`,
  }),
};

export default defineConfig({
  out: 'generated/wagmi.ts',
  contracts: [
    contract('EXA', ['optimism', 'op-sepolia', 'anvil'], true),
    contract('VELO', ['optimism'], true),
    { name: 'ERC20', abi: ERC20.abi as Abi },
    { name: 'Market', abi: Market.abi as Abi },
    contract('Airdrop', ['optimism', 'op-sepolia'], true),
    contract('Auditor', ['op-sepolia', 'ethereum', 'optimism', 'base', 'base-sepolia', 'anvil'], true),
    contract('Permit2', ['op-sepolia', 'ethereum', 'optimism', 'base', 'base-sepolia', 'anvil'], true),
    contract('EXAPool', ['optimism'], true),
    contract('Swapper', ['optimism', 'anvil'], true),
    contract('EXAGauge', ['optimism'], true),
    contract('Previewer', ['op-sepolia', 'optimism', 'base', 'base-sepolia', 'anvil'], true),
    contract('LegacyPreviewer', { ethereum: 'Previewer' }, true),
    contract('DebtManager', ['op-sepolia', 'ethereum', 'optimism', 'base-sepolia', 'anvil'], true),
    contract('DebtPreviewer', ['op-sepolia', 'ethereum', 'optimism', 'base-sepolia', 'anvil'], true),
    contract('MarketETHRouter', ['op-sepolia', 'ethereum', 'optimism', 'base', 'base-sepolia', 'anvil'], true),
    { name: 'InterestRateModel', abi: InterestRateModel.abi as Abi },
    contract('RatePreviewer', ['op-sepolia', 'optimism', 'base', 'base-sepolia', 'anvil'], true),
    contract('RewardsController', ['optimism', 'op-sepolia'], true),
    contract(
      'TimelockController',
      {
        ethereum: { block: true },
        optimism: { block: true },
        'op-sepolia': { block: true },
        base: { block: true },
        'base-sepolia': { block: true },
      },
      true,
    ),
    contract(
      'SablierV2LockupLinear',
      { optimism: { block: 106_405_061 }, 'op-sepolia': { block: 0 }, anvil: { block: true } },
      true,
    ),
    contract('SablierV2NFTDescriptor', ['optimism', 'op-sepolia', 'anvil'], true),
    { name: 'ExtraFinanceLending', abi: ExtraFinanceLendingABI as Abi },
    { name: 'DelegateRegistry', abi: DelegateRegistryABI as Abi },
    contract('EscrowedEXA', { optimism: 'esEXA', 'op-sepolia': 'esEXA', anvil: 'esEXA' }, true),
    { name: 'L1GasPriceOracle', abi: GasPriceOracle as Abi },
    contract('InstallmentsRouter', ['op-sepolia', 'optimism', 'base', 'base-sepolia', 'anvil'], true),
    contract(
      'StakedEXA',
      {
        'op-sepolia': { name: 'stEXA', block: true },
        optimism: { name: 'stEXA', block: true },
        anvil: { name: 'stEXA', block: true },
      },
      true,
    ),
    contract('StakingPreviewer', ['op-sepolia', 'optimism', 'anvil'], true),
    contract('PriceFeedDAI', ['ethereum', 'op-sepolia', 'base-sepolia']),
    contract('PriceFeedETH', ['ethereum']),
    contract('PriceFeedUSDC', ['ethereum', 'optimism', 'op-sepolia', 'base', 'base-sepolia', 'anvil']),
    contract('PriceFeedUSDCe', { optimism: 'PriceFeedUSDC.e', 'op-sepolia': 'PriceFeedUSDC.e' }),
    contract('PriceFeedWBTC', ['ethereum', 'optimism', 'op-sepolia']),
    contract('PriceFeedWETH', ['ethereum', 'optimism', 'op-sepolia', 'base', 'base-sepolia', 'anvil']),
    contract('PriceFeedwstETH', ['ethereum', 'optimism', 'op-sepolia']),
    contract('PriceFeedOP', ['optimism', 'op-sepolia', 'anvil']),
    contract('PriceFeedEXA', ['optimism', 'anvil']),
    contract('PriceFeedesEXA', ['optimism', 'op-sepolia', 'anvil']),
    contract('PriceFeedcbBTC', ['base', 'base-sepolia']),
    contract('PriceFeedcbXRP', ['base']),
    contract('InterestRateModelDAI', ['ethereum', 'op-sepolia', 'base-sepolia']),
    contract('InterestRateModelUSDC', ['ethereum', 'optimism', 'op-sepolia', 'base', 'base-sepolia', 'anvil']),
    contract('InterestRateModelWETH', ['ethereum', 'optimism', 'op-sepolia', 'base', 'base-sepolia', 'anvil']),
    contract('InterestRateModelwstETH', ['ethereum', 'optimism', 'op-sepolia']),
    contract('InterestRateModelOP', ['optimism', 'op-sepolia', 'anvil']),
    contract('InterestRateModelWBTC', ['ethereum', 'optimism', 'op-sepolia']),
    contract('MarketDAI', {
      ethereum: { block: true },
      'op-sepolia': { block: true },
      'base-sepolia': { block: true },
    }),
    contract('MarketUSDC', {
      ethereum: { block: true },
      optimism: { block: true },
      'op-sepolia': { block: true },
      base: { block: true },
      'base-sepolia': { block: true },
      anvil: { block: true },
    }),
    contract('MarketUSDCe', {
      optimism: { name: 'MarketUSDC.e', block: true },
      'op-sepolia': { name: 'MarketUSDC.e', block: true },
    }),
    contract('MarketWETH', {
      ethereum: { block: true },
      optimism: { block: true },
      'op-sepolia': { block: true },
      base: { block: true },
      'base-sepolia': { block: true },
      anvil: { block: true },
    }),
    contract('MarketwstETH', {
      ethereum: { block: true },
      optimism: { block: true },
      'op-sepolia': { block: true },
    }),
    contract('MarketOP', {
      optimism: { block: true },
      'op-sepolia': { block: true },
      anvil: { block: true },
    }),
    contract('MarketWBTC', {
      ethereum: { block: true },
      optimism: { block: true },
      'op-sepolia': { block: true },
    }),
    contract('MarketcbBTC', {
      base: { block: true },
      'base-sepolia': { block: true },
    }),
    contract('MarketcbXRP', { base: { block: true } }),
    contract('MarketEXA', { anvil: { block: true } }),
    contract('MarketDAIImplementation', {
      ethereum: 'MarketDAI_Implementation',
      'op-sepolia': 'MarketDAI_Implementation',
      'base-sepolia': 'MarketDAI_Implementation',
    }),
    contract('MarketUSDCImplementation', {
      ethereum: 'MarketUSDC_Implementation',
      optimism: 'MarketUSDC_Implementation',
      'op-sepolia': 'MarketUSDC_Implementation',
      base: 'MarketUSDC_Implementation',
      'base-sepolia': 'MarketUSDC_Implementation',
      anvil: 'MarketUSDC_Implementation',
    }),
    contract('MarketWETHImplementation', {
      ethereum: 'MarketWETH_Implementation',
      optimism: 'MarketWETH_Implementation',
      'op-sepolia': 'MarketWETH_Implementation',
      base: 'MarketWETH_Implementation',
      'base-sepolia': 'MarketWETH_Implementation',
      anvil: 'MarketWETH_Implementation',
    }),
    contract('MarketwstETHImplementation', {
      ethereum: 'MarketwstETH_Implementation',
      optimism: 'MarketwstETH_Implementation',
      'op-sepolia': 'MarketwstETH_Implementation',
    }),
    contract('MarketOPImplementation', {
      optimism: 'MarketOP_Implementation',
      'op-sepolia': 'MarketOP_Implementation',
      anvil: 'MarketOP_Implementation',
    }),
    contract('MarketWBTCImplementation', {
      ethereum: 'MarketWBTC_Implementation',
      optimism: 'MarketWBTC_Implementation',
      'op-sepolia': 'MarketWBTC_Implementation',
    }),
    contract('MarketETHRouterImplementation', {
      ethereum: 'MarketETHRouter_Implementation',
      optimism: 'MarketETHRouter_Implementation',
      'op-sepolia': 'MarketETHRouter_Implementation',
      base: 'MarketETHRouter_Implementation',
      'base-sepolia': 'MarketETHRouter_Implementation',
      anvil: 'MarketETHRouter_Implementation',
    }),
    contract('RewardsControllerImplementation', {
      optimism: 'RewardsController_Implementation',
      'op-sepolia': 'RewardsController_Implementation',
    }),
    contract('DebtManagerImplementation', {
      ethereum: 'DebtManager_Implementation',
      optimism: 'DebtManager_Implementation',
      'op-sepolia': 'DebtManager_Implementation',
      'base-sepolia': 'DebtManager_Implementation',
      anvil: 'DebtManager_Implementation',
    }),
    contract('AirdropImplementation', {
      optimism: 'Airdrop_Implementation',
      'op-sepolia': 'Airdrop_Implementation',
    }),
    contract('EXAImplementation', {
      optimism: 'EXA_Implementation',
      'op-sepolia': 'EXA_Implementation',
      anvil: 'EXA_Implementation',
    }),
    contract('EscrowedEXAImplementation', {
      optimism: 'esEXA_Implementation',
      'op-sepolia': 'esEXA_Implementation',
      anvil: 'esEXA_Implementation',
    }),
  ],
  plugins: [blocks, ratePreviewerCodes, actions(), react()],
});

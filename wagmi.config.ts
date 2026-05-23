import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';
import { createRequire } from 'node:module';

import { Abi } from 'viem';

const require = createRequire(import.meta.url);

const EXA = require('@exactly/protocol/deployments/optimism/EXA.json');
const ERC20 = require('@exactly/protocol/deployments/op-sepolia/DAI.json');
const VELO = require('@exactly/protocol/deployments/optimism/VELO.json');
const Airdrop = require('@exactly/protocol/deployments/optimism/Airdrop.json');
const Auditor = require('@exactly/protocol/deployments/op-sepolia/Auditor.json');
const Permit2 = require('@exactly/protocol/deployments/op-sepolia/Permit2.json');
const Market = require('@exactly/protocol/deployments/op-sepolia/MarketDAI.json');
const EXAPool = require('@exactly/protocol/deployments/optimism/EXAPool.json');
const Swapper = require('@exactly/protocol/deployments/optimism/Swapper.json');
const EXAGauge = require('@exactly/protocol/deployments/optimism/EXAGauge.json');
const Previewer = require('@exactly/protocol/deployments/op-sepolia/Previewer.json');
const LegacyPreviewer = require('@exactly/protocol/deployments/ethereum/Previewer.json');
const DebtManager = require('@exactly/protocol/deployments/op-sepolia/DebtManager.json');
const DebtPreviewer = require('@exactly/protocol/deployments/op-sepolia/DebtPreviewer.json');
const MarketETHRouter = require('@exactly/protocol/deployments/op-sepolia/MarketETHRouter.json');
const RewardsController = require('@exactly/protocol/deployments/op-sepolia/RewardsController.json');
const InterestRateModel = require('@exactly/protocol/deployments/op-sepolia/InterestRateModelDAI.json');
const RatePreviewer = require('@exactly/protocol/deployments/op-sepolia/RatePreviewer.json');
const ExtraFinanceLendingABI = require('./abi/extraFinanceLending.json');
const DelegateRegistryABI = require('./abi/DelegateRegistry.json');
const GasPriceOracle = require('./abi/GasPriceOracle.json');
const EscrowedEXA = require('@exactly/protocol/deployments/optimism/esEXA.json');
const SablierV2LockupLinear = require('@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json');
const SablierV2NFTDescriptor = require('@exactly/protocol/deployments/optimism/SablierV2NFTDescriptor.json');
const InstallmentsRouter = require('@exactly/protocol/deployments/op-sepolia/InstallmentsRouter.json');
const StakedEXA = require('@exactly/protocol/deployments/op-sepolia/stEXA.json');
const StakingPreviewer = require('@exactly/protocol/deployments/op-sepolia/StakingPreviewer.json');

export default defineConfig({
  out: 'types/abi.ts',
  contracts: [
    { name: 'EXA', abi: EXA.abi as Abi },
    { name: 'VELO', abi: VELO.abi as Abi },
    { name: 'ERC20', abi: ERC20.abi as Abi },
    { name: 'Market', abi: Market.abi as Abi },
    { name: 'Airdrop', abi: Airdrop.abi as Abi },
    { name: 'Auditor', abi: Auditor.abi as Abi },
    { name: 'Permit2', abi: Permit2.abi as Abi },
    { name: 'EXAPool', abi: EXAPool.abi as Abi },
    { name: 'Swapper', abi: Swapper.abi as Abi },
    { name: 'EXAGauge', abi: EXAGauge.abi as Abi },
    { name: 'Previewer', abi: Previewer.abi as Abi },
    { name: 'LegacyPreviewer', abi: LegacyPreviewer.abi as Abi },
    { name: 'DebtManager', abi: DebtManager.abi as Abi },
    { name: 'DebtPreviewer', abi: DebtPreviewer.abi as Abi },
    { name: 'MarketETHRouter', abi: MarketETHRouter.abi as Abi },
    { name: 'InterestRateModel', abi: InterestRateModel.abi as Abi },
    { name: 'RatePreviewer', abi: RatePreviewer.abi as Abi },
    { name: 'RewardsController', abi: RewardsController.abi as Abi },
    { name: 'SablierV2LockupLinear', abi: SablierV2LockupLinear.abi as Abi },
    { name: 'SablierV2NFTDescriptor', abi: SablierV2NFTDescriptor.abi as Abi },
    { name: 'ExtraFinanceLending', abi: ExtraFinanceLendingABI as Abi },
    { name: 'DelegateRegistry', abi: DelegateRegistryABI as Abi },
    { name: 'EscrowedEXA', abi: EscrowedEXA.abi as Abi },
    { name: 'L1GasPriceOracle', abi: GasPriceOracle as Abi },
    { name: 'InstallmentsRouter', abi: InstallmentsRouter.abi as Abi },
    { name: 'StakedEXA', abi: StakedEXA.abi as Abi },
    { name: 'StakingPreviewer', abi: StakingPreviewer.abi as Abi },
  ],
  plugins: [
    react({
      useContractRead: false,
      useContractWrite: false,
      useContractEvent: false,
      useContractItemEvent: false,
      useContractFunctionRead: true,
      useContractFunctionWrite: true,
      usePrepareContractWrite: false,
      usePrepareContractFunctionWrite: true,
    }),
  ],
});

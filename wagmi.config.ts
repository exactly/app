import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';

import EXA from '@exactly/protocol/deployments/optimism/EXA.json' assert { type: 'json' };
import ERC20 from '@exactly/protocol/deployments/op-sepolia/DAI.json' assert { type: 'json' };
import VELO from '@exactly/protocol/deployments/optimism/VELO.json' assert { type: 'json' };
import Airdrop from '@exactly/protocol/deployments/optimism/Airdrop.json' assert { type: 'json' };
import Auditor from '@exactly/protocol/deployments/op-sepolia/Auditor.json' assert { type: 'json' };
import Permit2 from '@exactly/protocol/deployments/op-sepolia/Permit2.json' assert { type: 'json' };
import Market from '@exactly/protocol/deployments/op-sepolia/MarketDAI.json' assert { type: 'json' };
import EXAPool from '@exactly/protocol/deployments/optimism/EXAPool.json' assert { type: 'json' };
import Swapper from '@exactly/protocol/deployments/optimism/Swapper.json' assert { type: 'json' };
import EXAGauge from '@exactly/protocol/deployments/optimism/EXAGauge.json' assert { type: 'json' };
import Previewer from '@exactly/protocol/deployments/op-sepolia/Previewer.json' assert { type: 'json' };
import LegacyPreviewer from '@exactly/protocol/deployments/ethereum/Previewer.json' assert { type: 'json' };
import DebtManager from '@exactly/protocol/deployments/op-sepolia/DebtManager.json' assert { type: 'json' };
import DebtPreviewer from '@exactly/protocol/deployments/op-sepolia/DebtPreviewer.json' assert { type: 'json' };
import MarketETHRouter from '@exactly/protocol/deployments/op-sepolia/MarketETHRouter.json' assert { type: 'json' };
import RewardsController from '@exactly/protocol/deployments/op-sepolia/RewardsController.json' assert { type: 'json' };
import InterestRateModel from '@exactly/protocol/deployments/op-sepolia/InterestRateModelDAI.json' assert { type: 'json' };
import ExtraFinanceLendingABI from './abi/extraFinanceLending.json' assert { type: 'json' };
import DelegateRegistryABI from './abi/DelegateRegistry.json' assert { type: 'json' };
import GasPriceOracle from './abi/GasPriceOracle.json' assert { type: 'json' };
import EscrowedEXA from '@exactly/protocol/deployments/optimism/esEXA.json' assert { type: 'json' };
import SablierV2LockupLinear from '@exactly/protocol/deployments/optimism/SablierV2LockupLinear.json' assert { type: 'json' };
import SablierV2NFTDescriptor from '@exactly/protocol/deployments/optimism/SablierV2NFTDescriptor.json' assert { type: 'json' };
import InstallmentsRouter from '@exactly/protocol/deployments/op-sepolia/InstallmentsRouter.json' assert { type: 'json' };

import { Abi } from 'viem';

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
    { name: 'RewardsController', abi: RewardsController.abi as Abi },
    { name: 'SablierV2LockupLinear', abi: SablierV2LockupLinear.abi as Abi },
    { name: 'SablierV2NFTDescriptor', abi: SablierV2NFTDescriptor.abi as Abi },
    { name: 'ExtraFinanceLending', abi: ExtraFinanceLendingABI as Abi },
    { name: 'DelegateRegistry', abi: DelegateRegistryABI as Abi },
    { name: 'EscrowedEXA', abi: EscrowedEXA.abi as Abi },
    { name: 'L1GasPriceOracle', abi: GasPriceOracle as Abi },
    { name: 'InstallmentsRouter', abi: InstallmentsRouter.abi as Abi },
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

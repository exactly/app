import { defineConfig } from '@wagmi/cli';
import { react } from '@wagmi/cli/plugins';

import ERC20 from '@exactly/protocol/deployments/goerli/DAI.json' assert { type: 'json' };
import Auditor from '@exactly/protocol/deployments/goerli/Auditor.json' assert { type: 'json' };
import Previewer from '@exactly/protocol/deployments/goerli/Previewer.json' assert { type: 'json' };
import Market from '@exactly/protocol/deployments/goerli/MarketDAI.json' assert { type: 'json' };
import MarketETHRouter from '@exactly/protocol/deployments/goerli/MarketETHRouter.json' assert { type: 'json' };
import InterestRateModel from '@exactly/protocol/deployments/goerli/InterestRateModelDAI.json' assert { type: 'json' };
import RewardsController from '@exactly/protocol/deployments/goerli/RewardsController.json' assert { type: 'json' };
import DebtManager from '@exactly/protocol/deployments/goerli/DebtManager.json' assert { type: 'json' };
import DebtPreviewer from '@exactly/protocol/deployments/goerli/DebtPreviewer.json' assert { type: 'json' };
import Permit2 from '@exactly/protocol/deployments/goerli/Permit2.json' assert { type: 'json' };

import { Abi } from 'viem';

export default defineConfig({
  out: 'types/abi.ts',
  contracts: [
    { name: 'ERC20', abi: ERC20.abi as Abi },
    { name: 'Auditor', abi: Auditor.abi as Abi },
    { name: 'Previewer', abi: Previewer.abi as Abi },
    { name: 'Market', abi: Market.abi as Abi },
    { name: 'MarketETHRouter', abi: MarketETHRouter.abi as Abi },
    { name: 'InterestRateModel', abi: InterestRateModel.abi as Abi },
    { name: 'RewardsController', abi: RewardsController.abi as Abi },
    { name: 'DebtManager', abi: DebtManager.abi as Abi },
    { name: 'DebtPreviewer', abi: DebtPreviewer.abi as Abi },
    { name: 'Permit2', abi: Permit2.abi as Abi },
  ],
  plugins: [
    react({
      useContractEvent: false,
      useContractItemEvent: false,
      useContractRead: false,
      useContractFunctionRead: true,
      useContractWrite: false,
      useContractFunctionWrite: true,
      usePrepareContractWrite: false,
      usePrepareContractFunctionWrite: true,
    }),
  ],
});

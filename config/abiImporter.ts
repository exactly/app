import goerliAuditor from 'protocol/deployments/goerli/Auditor.json';
import goerliFixedLenderDAI from 'protocol/deployments/goerli/MarketDAI.json';
import goerliFixedLenderWETH from 'protocol/deployments/goerli/MarketWETH.json';
import goerliFixedLenderWBTC from 'protocol/deployments/goerli/MarketWBTC.json';
import goerliFixedLenderUSDC from 'protocol/deployments/goerli/MarketUSDC.json';
import goerliFixedLenderWSTETH from 'protocol/deployments/goerli/MarketwstETH.json';
// import {abi as marketABI} from 'protocol/deployments/goerli/MarketUSDC.json';
import goerliPreviewer from 'protocol/deployments/goerli/Previewer.json';

import mainnetAuditor from 'protocol/deployments/mainnet/Auditor.json';
import mainnetFixedLenderDAI from 'protocol/deployments/mainnet/MarketDAI.json';
import mainnetFixedLenderWETH from 'protocol/deployments/mainnet/MarketWETH.json';
import mainnetFixedLenderWBTC from 'protocol/deployments/mainnet/MarketWBTC.json';
import mainnetFixedLenderUSDC from 'protocol/deployments/mainnet/MarketUSDC.json';
import mainnetFixedLenderWSTETH from 'protocol/deployments/mainnet/MarketwstETH.json';
import mainnetPreviewer from 'protocol/deployments/mainnet/Previewer.json';

import { Dictionary } from 'types/Dictionary';

function getABI(network: string | undefined) {
  const dictionary: Dictionary<Dictionary<any>> = {
    goerli: {
      FixedLenders: [
        goerliFixedLenderDAI,
        goerliFixedLenderUSDC,
        goerliFixedLenderWETH,
        goerliFixedLenderWBTC,
        goerliFixedLenderWSTETH,
      ],
      Auditor: goerliAuditor,
      Previewer: goerliPreviewer,
    },
    mainnet: {
      FixedLenders: [
        mainnetFixedLenderDAI,
        mainnetFixedLenderUSDC,
        mainnetFixedLenderWETH,
        mainnetFixedLenderWBTC,
        mainnetFixedLenderWSTETH,
      ],
      Auditor: mainnetAuditor,
      Previewer: mainnetPreviewer,
    },
    homestead: {
      // HACK - remove this name and use chainId instead of network names
      FixedLenders: [
        mainnetFixedLenderDAI,
        mainnetFixedLenderUSDC,
        mainnetFixedLenderWETH,
        mainnetFixedLenderWBTC,
        mainnetFixedLenderWSTETH,
      ],
      Auditor: mainnetAuditor,
      Previewer: mainnetPreviewer,
    },
  };

  return dictionary[network || process.env.NEXT_PUBLIC_NETWORK!] ?? dictionary.goerli;
}

export default getABI;
